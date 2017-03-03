/**
 * @file 游戏主场景
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/2/20
 * @class GameScene
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

define(
    [
        'cocos',
        'layers/tableLayer',
        'layers/zoomTableLayer',
        'layers/middleMsgLayer',
        'sprites/shootButton',
        'sprites/forceButton',
        'sprites/menuButton',
        'sprites/forceSlider',
        'benzAudioEngine',
        'i18n/i18n'
    ],
    function (cc, TableLayer, ZoomTableLayer, MiddleMsgLayer, ShootButton, ForceButton, MenuButton, ForceSlider, benzAudioEngine, i18n) {
        var CONTROL_BAR_HEIGHT = 220;
        var SCORE_BAR_HEIGHT = 98;

        return cc.Scene.extend({
            ctor: function () {
                this._super();

                this.fixedLayer = new cc.LayerColor(cc.color(0, 0, 0));
                if (cc.sys.isMobile && cc._renderType === cc.game.RENDER_TYPE_CANVAS) {
                    this.fixedLayer.setPosition(cc.visibleRect.bottomLeft);
                    this.fixedLayer.setContentSize(cc.visibleRect.width, cc.visibleRect.height);
                }
                this.addChild(this.fixedLayer);

                if (cc.sys.capabilities['touches']) {
                    this.zoomTableLayer = new ZoomTableLayer();
                    this.tableLayer = this.zoomTableLayer.tableLayer;

                    this.zoomTableLayer.setPosition(0, CONTROL_BAR_HEIGHT);
                    this.zoomTableLayer.setContentSize(cc.visibleRect.width, cc.visibleRect.height - CONTROL_BAR_HEIGHT - SCORE_BAR_HEIGHT);
                    this.fixedLayer.addChild(this.zoomTableLayer, 1);
                    this.initTouch();
                } else {
                    this.tableLayer = new TableLayer();
                    this.tableLayer.setPosition(
                        (cc.visibleRect.width - TableLayer.TABLE_WIDTH) / 2,
                        (cc.visibleRect.height - TableLayer.TABLE_HEIGHT) / 2);
                    this.fixedLayer.addChild(this.tableLayer, 1);
                    this.initMouse();
                }

                this.force = 100;

                this.middleMsgLayer = new MiddleMsgLayer();
                this.fixedLayer.addChild(this.middleMsgLayer, 2);

                this.initScoreBar();
                this.initTableClear();
            },

            initMouse: function () {
                var mouseListener = cc.EventListener.create({
                    event: cc.EventListener.MOUSE,
                    onMouseMove: function (event) {
                        var target = event.getCurrentTarget();
                        if (target.status !== TableLayer.STATUS_READY) return false;
                        var pos = target.convertToNodeSpace(event.getLocation());
                        target.setAimLine(pos);
                    },
                    onMouseUp: function (event) {
                        var target = event.getCurrentTarget();
                        if (target.status !== TableLayer.STATUS_READY) return false;
                        if (event.getButton() == cc.EventMouse.BUTTON_LEFT) {
                            target.shootMasterBall();
                        }
                    }
                });
                cc.eventManager.addListener(mouseListener, this.tableLayer);

                // 鼠标和触屏的控制光标的方式不一样，因此显示/隐藏光标的逻辑也不一样，于是分别写
                cc.eventManager.addCustomListener('table:status_ready', function () {
                    //this.forceSlider.setValue(100);
                }.bind(this));
            },

            initTouch: function () {
                this.initControlBar();

                this.tableLayer.setAimLine(cc.p(TableLayer.TABLE_WIDTH / 2, TableLayer.TABLE_HEIGHT / 2));

                // 鼠标和触屏的控制光标的方式不一样，因此显示/隐藏光标的逻辑也不一样，于是分别写
                cc.eventManager.addCustomListener('table:status_ready', function () {
                    this.tableLayer.setAimLine(this.tableLayer.ballCursor.getPosition());
                    this.forceSlider.setValue(100);
                }.bind(this));
            },

            initScoreBar: function () {
                this.scoreBarBg = new cc.LayerColor(cc.color(0, 0, 0, 128), cc.visibleRect.width, SCORE_BAR_HEIGHT);
                this.scoreBarBg.setPosition(0, cc.visibleRect.height - SCORE_BAR_HEIGHT);
                this.fixedLayer.addChild(this.scoreBarBg, 2);

                this.turnsLabel = new cc.LabelTTF(i18n('回合 %d').replace('%d', this.tableLayer.turns + 1), i18n.defaultFont, 48);
                this.turnsLabel.setColor(cc.color(0, 255, 0));
                this.turnsLabel.setPosition(cc.visibleRect.width / 2, SCORE_BAR_HEIGHT / 2);
                this.scoreBarBg.addChild(this.turnsLabel);

                cc.eventManager.addCustomListener('table:status_ready', function () {
                    this.turnsLabel.setString(i18n('回合 %d').replace('%d', this.tableLayer.turns + 1));
                }.bind(this));

                cc.eventManager.addCustomListener('table:reset', function () {
                    this.turnsLabel.setString(i18n('回合 %d').replace('%d', 1));
                }.bind(this));
            },

            initControlBar: function () {
                this.controlBarBg = new cc.LayerColor(cc.color(0, 0, 0, 128), cc.visibleRect.width, CONTROL_BAR_HEIGHT);
                this.fixedLayer.addChild(this.controlBarBg, 2);

                this.shootButton = new ShootButton();
                var shootButtonSize = this.shootButton.getContentSize();
                this.shootButton.setPosition(
                    cc.visibleRect.width - 32 - shootButtonSize.width / 2,
                    50 + shootButtonSize.height / 2
                );
                this.controlBarBg.addChild(this.shootButton, 3);

                this.shootButton.addTargetWithActionForControlEvents(this, function () {
                    if (this.tableLayer.status !== TableLayer.STATUS_READY) return;
                    this.zoomTableLayer.resetTable(true);
                    this.tableLayer.shootMasterBall(this.force / 100);
                    this.hideForceCtrl();
                }, cc.CONTROL_EVENT_TOUCH_UP_INSIDE);

                this.forceButton = new ForceButton();
                var forceButtonSize = this.forceButton.getContentSize();
                this.forceButton.setPosition(
                    this.shootButton.getBoundingBox().x - 30 - forceButtonSize.width / 2,
                    50 + shootButtonSize.height / 2
                );
                this.controlBarBg.addChild(this.forceButton, 3);

                this.forceSlider = new ForceSlider();
                var forceSliderSize = this.forceSlider.getContentSize();
                this.forceSlider.setPosition(
                    cc.visibleRect.width / 2,
                    CONTROL_BAR_HEIGHT + forceSliderSize.height / 2
                );
                this.forceSlider.setVisible(false);
                this.controlBarBg.addChild(this.forceSlider, 3);

                this.forceButton.addTargetWithActionForControlEvents(this, function () {
                    if (this.tableLayer.status !== TableLayer.STATUS_READY) return;
                    if (this.forceSlider.isVisible()) {
                        this.hideForceCtrl();
                    } else {
                        this.showForceCtrl();
                    }
                }, cc.CONTROL_EVENT_TOUCH_UP_INSIDE);

                this.forceSlider.addTargetWithActionForControlEvents(this, function () {
                    this.force = this.forceSlider.getValue();
                    this.forceButton.setForceNumber(this.force);
                }, cc.CONTROL_EVENT_VALUECHANGED);

                this.force = this.tableLayer.shoot.force * 100 || 100;
                this.forceSlider.setValue(this.force);

                cc.eventManager.addCustomListener('table:reset', function () {
                    this.force = 100;
                    this.forceSlider.setValue(100);
                }.bind(this));

                cc.eventManager.addCustomListener('table:status_change', function (event) {
                    var data = event.getUserData();
                    var status = data.new;
                    if (status === TableLayer.STATUS_READY) {
                        this.shootButton.setEnabled(true);
                        this.forceButton.setEnabled(true);
                    } else {
                        this.shootButton.setEnabled(false);
                        this.forceButton.setEnabled(false);
                    }
                }.bind(this));

                this.menuButton = new MenuButton();
                var menuButtonSize = this.menuButton.getContentSize();
                this.menuButton.setPosition(32 + menuButtonSize.width / 2, 50 + menuButtonSize.height / 2);
                this.controlBarBg.addChild(this.menuButton, 3);

                this.menuButton.addTargetWithActionForControlEvents(this, function () {
                    this.showMenu();
                }, cc.CONTROL_EVENT_TOUCH_UP_INSIDE);

                this.initMenu();
            },

            showForceCtrl: function () {
                this.forceSlider.setVisible(true);
                this.controlBarBg.setContentSize(cc.visibleRect.width, CONTROL_BAR_HEIGHT + 25 + this.forceSlider.getContentSize().height);
            },

            hideForceCtrl: function () {
                this.forceSlider.setVisible(false);
                this.controlBarBg.setContentSize(cc.visibleRect.width, CONTROL_BAR_HEIGHT);
            },

            initMenu: function () {
                var MENU_FONT_SIZE = 72;
                var MENU_COLOR = new cc.Color(0, 255, 0);

                var resumeLabel = new cc.LabelTTF(i18n('继续'), i18n.defaultFont, MENU_FONT_SIZE);
                resumeLabel.setColor(MENU_COLOR);
                var resumeMenuItem = new cc.MenuItemLabel(resumeLabel, this.hideMenu.bind(this), this);

                this.enableSound = true;
                var toggleSfxLabel = new cc.LabelTTF(i18n('音效：开'), i18n.defaultFont, MENU_FONT_SIZE);
                toggleSfxLabel.setColor(MENU_COLOR);
                var toggleSfxMenuItem = new cc.MenuItemLabel(toggleSfxLabel, function () {
                    if (this.enableSound) {
                        toggleSfxMenuItem.setString(i18n('音效：关'));
                        this.enableSound = false;
                        //cc.audioEngine.setEffectsVolume(0.0);
                        benzAudioEngine.setMuted(true);
                    } else {
                        toggleSfxMenuItem.setString(i18n('音效：开'));
                        this.enableSound = true;
                        //cc.audioEngine.setEffectsVolume(1.0);
                        benzAudioEngine.setMuted(false);
                        benzAudioEngine.play('res/hit-ball.mp3');
                    }
                }.bind(this), this);

                var restartGameLabel = new cc.LabelTTF(i18n('重新开始'), i18n.defaultFont, MENU_FONT_SIZE);
                restartGameLabel.setColor(MENU_COLOR);
                var restartGameMenuItem = new cc.MenuItemLabel(restartGameLabel, this.restartGame.bind(this), this);

                this.pauseMenuLayer = new cc.LayerColor(cc.color(0, 0, 0, 128));
                this.pauseMenuLayer.setContentSize(this.fixedLayer.getContentSize());
                this.pauseMenuLayer.setVisible(false);
                this.pauseMenu = new cc.Menu(resumeMenuItem, toggleSfxMenuItem, restartGameMenuItem);
                this.pauseMenu.setPosition(cc.visibleRect.width / 2, cc.visibleRect.height / 2);
                this.pauseMenu.alignItemsVerticallyWithPadding(30);
                this.pauseMenuLayer.addChild(this.pauseMenu);

                this.fixedLayer.addChild(this.pauseMenuLayer, 10);
            },

            showMenu: function () {
                this.pauseMenuLayer.setVisible(true);
                this.pauseGame();
            },

            hideMenu: function () {
                this.pauseMenuLayer.setVisible(false);
                this.resumeGame();
            },

            pauseGame: function () {
                this.tableLayer.pause();
                if (this.zoomTableLayer) {
                    this.zoomTableLayer.pause();
                }
                if (this.controlBarBg) {
                    this.controlBarBg.setVisible(false);
                }
            },

            resumeGame: function () {
                if (this.controlBarBg) {
                    this.controlBarBg.setVisible(true);
                }
                if (this.zoomTableLayer) {
                    this.zoomTableLayer.resume();
                }
                this.tableLayer.resume();
            },

            restartGame: function () {
                if (this.tableLayer.turns > 2 && !confirm(i18n('确定要放弃当前游戏进度么？'))) {return;}
                this.hideMenu();
                this.tableLayer.resetTable();
            },

            initTableClear: function () {
                var v = cc.visibleRect;

                this.clearLayer = new cc.LayerColor(cc.color(0, 0, 0, 128), v.width, v.height);
                this.clearLayer.setVisible(false);
                this.fixedLayer.addChild(this.clearLayer, 3);

                this.gameOverLabel = new cc.LabelTTF(i18n('清空!'), i18n.defaultFont, 128);
                this.gameOverLabel.setPosition(v.width / 2, v.height / 2 + 280);
                this.gameOverLabel.setColor(new cc.Color(128, 255, 128));
                this.clearLayer.addChild(this.gameOverLabel, 1);

                this.finalScoreLabel = new cc.LabelTTF(i18n('你用了 %d 回合').replace('%d', this.tableLayer.turns), i18n.defaultFont, 96);
                this.finalScoreLabel.setPosition(v.width / 2, v.height / 2 + 128);
                this.finalScoreLabel.setColor(new cc.Color(255, 255, 255));
                this.clearLayer.addChild(this.finalScoreLabel, 1);

                var replayLabel = new cc.LabelTTF(i18n('再来一局'), i18n.defaultFont, 72);
                replayLabel.setColor(new cc.Color(0, 255, 0));
                replayLabel.enableStroke(new cc.Color(10, 10, 10), 2);
                var replayItem = new cc.MenuItemLabel(replayLabel, function () {
                    this.resumeGame();
                    this.tableLayer.resetTable();
                    this.clearLayer.setVisible(false);
                }, this);
                /*var exitLabel = new cc.LabelTTF(i18n('返回主菜单'), i18n.defaultFont, 72);
                exitLabel.setColor(new cc.Color(0, 255, 0));
                exitLabel.enableStroke(new cc.Color(10, 10, 10), 2);
                var exitItem = new  cc.MenuItemLabel(exitLabel, function () {
                    // todo
                }, this);*/
                this.replayMenu = new cc.Menu(replayItem/*, exitItem*/);
                this.replayMenu.setPosition(v.width / 2, v.height * 0.4);
                this.replayMenu.alignItemsVerticallyWithPadding(30);
                this.clearLayer.addChild(this.replayMenu, 1);

                cc.eventManager.addCustomListener('table:status_clear', function (event) {
                    var turns = event.getUserData()['turns'];
                    this.finalScoreLabel.setString(i18n('你用了 %d 回合').replace('%d', turns));
                    this.pauseGame();
                    document.title = i18n('我在《欢乐台球》用了%d回合清空桌面!').replace('%d', turns + '');
                    this.runAction(cc.sequence([
                        cc.repeat(cc.sequence([
                            cc.callFunc(function () {
                                this.tableLayer.setTableColor(cc.color(255, 255, 255));
                            }, this),
                            cc.delayTime(0.05),
                            cc.callFunc(function () {
                                this.tableLayer.resetTableColor();
                            }, this),
                            cc.delayTime(0.05)
                        ]), 5),
                        cc.delayTime(0.5),
                        cc.callFunc(function () {
                            this.clearLayer.setVisible(true);
                        }, this)
                    ]));


                    // 百度统计
                    if (window['_hmt']) {
                        window['_hmt'].push(['_trackEvent', 'funnyBillards_' + (cc.sys.isMobile ? 'Mobile' : 'Desktop'), 'clear', turns + '']);
                    }
                }.bind(this));
            }
        });
});
