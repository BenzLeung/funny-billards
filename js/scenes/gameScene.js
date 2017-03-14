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
                        (cc.visibleRect.height - TableLayer.TABLE_HEIGHT) / 3);
                    this.fixedLayer.addChild(this.tableLayer, 1);
                    this.initMouse();
                }

                this.force = 100;

                this.middleMsgLayer = new MiddleMsgLayer();
                this.fixedLayer.addChild(this.middleMsgLayer, 2);

                this.initScoreBar();
                this.initTableClear();

                this.isPaused = false;
            },

            onEnter: function () {
                this._super();
                if (this.enableMusic) {
                    this.playBgm();
                }
            },

            onExit: function () {
                this.stopBgm();
                this._super();
            },

            initMouse: function () {
                this.initDesktopControl();

                var mouseListener = cc.EventListener.create({
                    event: cc.EventListener.MOUSE,
                    holding: false,
                    holdingDelayIdx: 0,
                    onMouseDown: function (event) {
                        var target = event.getCurrentTarget();
                        if (target.tableLayer.status !== TableLayer.STATUS_READY) return false;
                        var pos = target.tableLayer.convertToNodeSpace(event.getLocation());
                        if (!target.tableLayer.posInTable(pos)) return true;
                        if (!target.isPaused && event.getButton() == cc.EventMouse.BUTTON_LEFT) {
                            target.forceSlider.setValue(100);
                            target.showForceCtrl();
                            this.holding = true;
                        }
                    },
                    onMouseMove: function (event) {
                        var target = event.getCurrentTarget();
                        if (target.tableLayer.status !== TableLayer.STATUS_READY) return false;
                        if (this.holding) {
                            var d = event.getDelta();
                            target.force += d.x / 10;
                            target.forceSlider.setValue(target.force);
                        } else {
                            var pos = target.tableLayer.convertToNodeSpace(event.getLocation());
                            if (!target.isPaused) {
                                target.tableLayer.setAimLine(pos);
                            }
                        }
                    },
                    onMouseUp: function (event) {
                        var target = event.getCurrentTarget();
                        if (target.tableLayer.status !== TableLayer.STATUS_READY) return false;
                        if (!target.isPaused && this.holding && event.getButton() == cc.EventMouse.BUTTON_LEFT) {
                            target.hideForceCtrl();
                            this.holding = false;
                            target.tableLayer.shootMasterBall(target.force / 100);
                        }
                    }
                });
                cc.eventManager.addListener(mouseListener, this);

                // 鼠标和触屏的控制光标的方式不一样，因此显示/隐藏光标的逻辑也不一样，于是分别写
                cc.eventManager.addCustomListener('table:status_ready', function () {
                    //this.forceSlider.setValue(100);
                }.bind(this));
            },

            initTouch: function () {
                this.initMobileControlBar();

                this.tableLayer.setAimLine(cc.p(TableLayer.TABLE_WIDTH / 2, TableLayer.TABLE_HEIGHT / 2));

                // 鼠标和触屏的控制光标的方式不一样，因此显示/隐藏光标的逻辑也不一样，于是分别写
                cc.eventManager.addCustomListener('table:status_ready', function () {
                    this.tableLayer.setAimLine(this.tableLayer.ballCursor.getPosition());
                    this.forceSlider.setValue(100);
                }.bind(this));

                // 添加控制提示
                this.initTouchTips();
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

            initDesktopControl: function () {
                this.menuButton = new MenuButton();
                var menuButtonSize = this.menuButton.getContentSize();
                var v = cc.visibleRect;
                this.menuButton.setPosition(v.width - menuButtonSize.width / 2 - 32, v.height - menuButtonSize.height / 2 - 25);
                this.fixedLayer.addChild(this.menuButton, 3);

                this.menuButton.addTargetWithActionForControlEvents(this, function () {
                    this.showMenu();
                }, cc.CONTROL_EVENT_TOUCH_UP_INSIDE);

                this.forceSlider = new ForceSlider();
                this.forceSlider.setAllowTouch(false);
                var forceSliderSize = this.forceSlider.getContentSize();
                var forceSliderBgSize = cc.size(forceSliderSize.width + 100, forceSliderSize.height + 24 + 48 + 13);
                this.forceSlider.setPosition(
                    forceSliderBgSize.width / 2,
                    forceSliderSize.height / 2 + 12
                );

                this.forceLabel = new cc.LabelTTF(i18n('力度') + ' 100', i18n.defaultFont, 48);
                this.forceLabel.setColor(cc.color(255, 255, 255));
                this.forceLabel.setPosition(forceSliderBgSize.width / 2, forceSliderSize.height + 36);

                this.forceSliderBg = new cc.LayerColor(
                    cc.color(0, 0, 0, 128),
                    forceSliderBgSize.width,
                    forceSliderBgSize.height
                );
                this.forceSliderBg.setPosition(
                    cc.visibleRect.width / 2,
                    cc.visibleRect.height / 2
                );
                this.forceSliderBg.ignoreAnchorPointForPosition(false);
                this.forceSliderBg.setAnchorPoint(0.5, 0.5);
                this.forceSliderBg.setVisible(false);


                this.forceSliderBg.addChild(this.forceSlider);
                this.forceSliderBg.addChild(this.forceLabel);
                this.fixedLayer.addChild(this.forceSliderBg, 2);

                this.forceSlider.addTargetWithActionForControlEvents(this, function () {
                    this.force = this.forceSlider.getValue();
                    this.forceLabel.setString(i18n('力度') + ' ' + Math.round(this.force));
                }.bind(this), cc.CONTROL_EVENT_VALUECHANGED);

                this.force = this.tableLayer.shoot.force * 100 || 100;

                this.initMenu();
            },

            initMobileControlBar: function () {
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
                    forceSliderSize.height / 2
                );

                this.forceSliderBg = new cc.LayerColor(cc.color(0, 0, 0, 128), cc.visibleRect.width, forceSliderSize.height + 25);
                this.forceSliderBg.setPosition(
                    cc.visibleRect.width / 2,
                    CONTROL_BAR_HEIGHT + (forceSliderSize.height + 25) / 2
                );
                this.forceSliderBg.ignoreAnchorPointForPosition(false);
                this.forceSliderBg.setAnchorPoint(0.5, 0.5);
                this.forceSlider.setVisible(false);
                this.forceSliderBg.setVisible(false);
                this.forceSliderBg.addChild(this.forceSlider);
                this.fixedLayer.addChild(this.forceSliderBg, 2);

                this.forceButton.addTargetWithActionForControlEvents(this, function () {
                    if (this.tableLayer.status !== TableLayer.STATUS_READY) return;
                    if (this.forceSliderBg.isVisible()) {
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
                this.forceSliderBg.setVisible(true);
                this.forceSlider.setVisible(true);
            },

            hideForceCtrl: function () {
                this.forceSlider.setVisible(false);
                this.forceSliderBg.setVisible(false);
            },

            initMenu: function () {
                var MENU_FONT_SIZE = cc.sys.isMobile ? 72 : 50;
                var MENU_COLOR = new cc.Color(0, 255, 0);

                var resumeLabel = new cc.LabelTTF(i18n('继续'), i18n.defaultFont, MENU_FONT_SIZE);
                resumeLabel.setColor(MENU_COLOR);
                var resumeMenuItem = new cc.MenuItemLabel(resumeLabel, this.hideMenu.bind(this), this);

                var restartGameLabel = new cc.LabelTTF(i18n('重新开始'), i18n.defaultFont, MENU_FONT_SIZE);
                restartGameLabel.setColor(MENU_COLOR);
                var restartGameMenuItem = new cc.MenuItemLabel(restartGameLabel, this.restartGame.bind(this), this);

                this.enableSound = !!parseInt(cc.sys.localStorage.getItem('enableSfx'), 10);
                var toggleSfxLabel = new cc.LabelTTF(i18n(this.enableSound ? '音效：开' : '音效：关'), i18n.defaultFont, MENU_FONT_SIZE);
                toggleSfxLabel.setColor(MENU_COLOR);
                var toggleSfxMenuItem = new cc.MenuItemLabel(toggleSfxLabel, function () {
                    if (this.enableSound) {
                        toggleSfxMenuItem.setString(i18n('音效：关'));
                        this.enableSound = false;
                        this.tableLayer.mute = true;
                        cc.sys.localStorage.setItem('enableSfx', 0);
                    } else {
                        toggleSfxMenuItem.setString(i18n('音效：开'));
                        this.enableSound = true;
                        this.tableLayer.mute = false;
                        cc.sys.localStorage.setItem('enableSfx', 1);
                        benzAudioEngine.play('res/hit-ball.mp3');
                    }
                }.bind(this), this);
                this.tableLayer.mute = !this.enableSound;

                this.enableMusic = !!parseInt(cc.sys.localStorage.getItem('enableBgm'), 10);
                var toggleMusicLabel = new cc.LabelTTF(i18n(this.enableMusic ? '背景音乐：开' : '背景音乐：关'), i18n.defaultFont, MENU_FONT_SIZE);
                toggleMusicLabel.setColor(MENU_COLOR);
                var toggleMusicMenuItem = new cc.MenuItemLabel(toggleMusicLabel, function () {
                    if (this.enableMusic) {
                        toggleMusicMenuItem.setString(i18n('背景音乐：关'));
                        this.enableMusic = false;
                        cc.sys.localStorage.setItem('enableBgm', 0);
                        this.stopBgm();
                    } else {
                        toggleMusicMenuItem.setString(i18n('背景音乐：开'));
                        this.enableMusic = true;
                        cc.sys.localStorage.setItem('enableBgm', 1);
                        this.playBgm();
                    }
                }.bind(this), this);

                var controlTipsLabel = new cc.LabelTTF(i18n('操作说明'), i18n.defaultFont, MENU_FONT_SIZE);
                controlTipsLabel.setColor(MENU_COLOR);
                var controlTipsMenuItem = new cc.MenuItemLabel(controlTipsLabel, function () {
                    this.hideMenu();
                    this.showControlTips();
                }.bind(this), this);

                var exitLabel = new cc.LabelTTF(i18n('返回主菜单'), i18n.defaultFont, MENU_FONT_SIZE);
                exitLabel.setColor(new cc.Color(0, 255, 0));
                var exitItem = new  cc.MenuItemLabel(exitLabel, this.exitGame.bind(this), this);

                this.pauseMenuLayer = new cc.LayerColor(cc.color(0, 0, 0, 128));
                this.pauseMenuLayer.setContentSize(this.fixedLayer.getContentSize());
                this.pauseMenuLayer.setVisible(false);

                var menuList = [resumeMenuItem, restartGameMenuItem];
                if (benzAudioEngine.support()) {
                    menuList.push(toggleSfxMenuItem, toggleMusicMenuItem);
                }
                if (cc.sys.isMobile) {
                    menuList.push(controlTipsMenuItem);
                }
                menuList.push(exitItem);
                this.pauseMenu = new cc.Menu(menuList);
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
                this.isPaused = true;
            },

            resumeGame: function () {
                if (this.controlBarBg) {
                    this.controlBarBg.setVisible(true);
                }
                if (this.zoomTableLayer) {
                    this.zoomTableLayer.resume();
                }
                this.tableLayer.resume();
                this.isPaused = false;
            },

            restartGame: function () {
                if (this.tableLayer.turns > 2 && !confirm(i18n('确定要放弃当前游戏进度么？'))) {return;}
                this.hideMenu();
                this.tableLayer.resetTable();
            },

            playBgm: function () {
                if (this.enableMusic) {
                    this.bgmId = benzAudioEngine.play('res/bgm.mp3', 0.550, 31.251);
                }
            },

            stopBgm: function () {
                if (this.bgmId !== undefined) {
                    benzAudioEngine.stop(this.bgmId);
                }
            },

            playClearBgm: function () {
                if (this.enableMusic) {
                    this.stopBgm();
                    benzAudioEngine.play('res/clear.mp3');
                }
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

                this.maxComboLabel = new cc.LabelTTF(i18n('最大连击数：%d').replace('%d', this.tableLayer.maxCombo), i18n.defaultFont, 72);
                this.maxComboLabel.setPosition(v.width / 2, v.height / 2);
                this.maxComboLabel.setColor(new cc.Color(255, 255, 0));
                this.clearLayer.addChild(this.maxComboLabel, 1);

                var MENU_FONT_SIZE = cc.sys.isMobile ? 72 : 50;

                var replayLabel = new cc.LabelTTF(i18n('再来一局'), i18n.defaultFont, MENU_FONT_SIZE);
                replayLabel.setColor(new cc.Color(0, 255, 0));
                replayLabel.enableStroke(new cc.Color(10, 10, 10), 2);
                var replayItem = new cc.MenuItemLabel(replayLabel, function () {
                    this.resumeGame();
                    this.tableLayer.resetTable();
                    this.clearLayer.setVisible(false);
                    this.playBgm();
                }, this);
                var exitLabel = new cc.LabelTTF(i18n('返回主菜单'), i18n.defaultFont, MENU_FONT_SIZE);
                exitLabel.setColor(new cc.Color(0, 255, 0));
                exitLabel.enableStroke(new cc.Color(10, 10, 10), 2);
                var exitItem = new  cc.MenuItemLabel(exitLabel, this.exitGame.bind(this), this);
                this.replayMenu = new cc.Menu(replayItem, exitItem);
                this.replayMenu.setPosition(v.width / 2, v.height * 0.325);
                this.replayMenu.alignItemsVerticallyWithPadding(30);
                this.clearLayer.addChild(this.replayMenu, 2);

                var qrcode = new cc.Sprite('res/qrcode.png');
                qrcode.setPosition(v.width / 2, 125);
                this.clearLayer.addChild(qrcode, 1);

                cc.eventManager.addCustomListener('table:status_clear', function (event) {
                    var data = event.getUserData();
                    var turns = data['turns'];
                    var maxCombo = data['maxCombo'];
                    this.finalScoreLabel.setString(i18n('你用了 %d 回合').replace('%d', turns));
                    this.maxComboLabel.setString(i18n('最大连击数：%d').replace('%d', maxCombo));
                    this.pauseGame();
                    document.title = i18n('我在《欢乐台球》用了%d回合清空桌面!').replace('%d', turns + '');
                    this.playClearBgm();
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
            },

            initTouchTips: function () {
                this.tipsLayer = new cc.LayerColor(cc.color(0, 0, 0, 192), cc.visibleRect.width, cc.visibleRect.height);
                var fingerImage = cc.textureCache.addImage('res/fingers.png');

                var singleFinger = new cc.SpriteFrame(
                    fingerImage,
                    cc.rect(0, 0, fingerImage.pixelsWidth / 3, fingerImage.pixelsHeight)
                );
                singleFinger = new cc.Sprite(singleFinger);
                singleFinger.setPosition(cc.visibleRect.width / 2, cc.visibleRect.height / 2 + 450);

                var doubleFinger = new cc.SpriteFrame(
                    fingerImage,
                    cc.rect(fingerImage.pixelsWidth / 3, 0, fingerImage.pixelsWidth / 3, fingerImage.pixelsHeight)
                );
                doubleFinger = new cc.Sprite(doubleFinger);
                doubleFinger.setPosition(cc.visibleRect.width / 2, cc.visibleRect.height / 2 + 100);

                var autoSave = new cc.SpriteFrame(
                    fingerImage,
                    cc.rect(fingerImage.pixelsWidth / 3 * 2, 0, fingerImage.pixelsWidth / 3, fingerImage.pixelsHeight)
                );
                autoSave = new cc.Sprite(autoSave);
                autoSave.setPosition(cc.visibleRect.width / 2, cc.visibleRect.height / 2 - 250);

                var singleFingerLabel = new cc.LabelTTF(i18n('单指移动光标'), i18n.defaultFont, 50);
                singleFingerLabel.setColor(cc.color(255, 255, 255));
                singleFingerLabel.setPosition(cc.visibleRect.width / 2, cc.visibleRect.height / 2 + 300);

                var doubleFingerLabel = new cc.LabelTTF(i18n('双指缩放桌子'), i18n.defaultFont, 50);
                doubleFingerLabel.setColor(cc.color(255, 255, 255));
                doubleFingerLabel.setPosition(cc.visibleRect.width / 2, cc.visibleRect.height / 2 - 50);

                var autoSaveLabel = new cc.LabelTTF(i18n('自动保存进度，可随时离开游戏'), i18n.defaultFont, 50,
                    cc.size(cc.visibleRect.width - 100, 0), cc.TEXT_ALIGNMENT_CENTER);
                autoSaveLabel.setColor(cc.color(255, 255, 255));
                autoSaveLabel.setPosition(cc.visibleRect.width / 2, cc.visibleRect.height / 2 - 400);

                this.tipsLayer.addChild(singleFinger);
                this.tipsLayer.addChild(singleFingerLabel);
                this.tipsLayer.addChild(doubleFinger);
                this.tipsLayer.addChild(doubleFingerLabel);
                this.tipsLayer.addChild(autoSave);
                this.tipsLayer.addChild(autoSaveLabel);

                this.tipsLayer.setVisible(false);
                this.fixedLayer.addChild(this.tipsLayer, 20);

                if (!cc.sys.localStorage.getItem('firstControlTips')) {
                    this.showControlTips();
                    cc.sys.localStorage.setItem('firstControlTips', 1);
                }
            },

            showControlTips: function () {
                this.tipsLayer.setVisible(true);
                this.pauseGame();

                var touchListener = cc.EventListener.create({
                    event: cc.EventListener.TOUCH_ALL_AT_ONCE,
                    onTouchesBegan: function (touches, event) {
                        var target = event.getCurrentTarget();
                        target.resumeGame();
                        target.tipsLayer.setVisible(false);
                        cc.eventManager.removeListener(touchListener);
                        return true;
                    }
                });

                cc.eventManager.addListener(touchListener, this);
            },

            exitGame:function () {
                if (this.enableSound) {
                    benzAudioEngine.play('res/lost-master.mp3');
                }
                require(['scenes/titleScene'], function (TitleScene) {
                    cc.director.runScene(new cc.TransitionFade(0.5, new TitleScene()));
                });
            }
        });
});
