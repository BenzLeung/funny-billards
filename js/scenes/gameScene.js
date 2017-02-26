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
        'sprites/shootButton',
        'sprites/forceButton',
        'sprites/menuButton',
        'sprites/forceSlider',
        'i18n/i18n'
    ],
    function (cc, TableLayer, ZoomTableLayer, ShootButton, ForceButton, MenuButton, ForceSlider, i18n) {
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

                var restartGameLabel = new cc.LabelTTF(i18n('重新开始'), i18n.defaultFont, MENU_FONT_SIZE);
                restartGameLabel.setColor(MENU_COLOR);
                var restartGameMenuItem = new cc.MenuItemLabel(restartGameLabel, this.restartGame.bind(this), this);

                this.pauseMenuLayer = new cc.LayerColor(cc.color(0, 0, 0, 128));
                this.pauseMenuLayer.setContentSize(this.fixedLayer.getContentSize());
                this.pauseMenuLayer.setVisible(false);
                this.pauseMenu = new cc.Menu(resumeMenuItem, restartGameMenuItem);
                this.pauseMenu.setPosition(cc.visibleRect.width / 2, cc.visibleRect.height / 2);
                this.pauseMenu.alignItemsVerticallyWithPadding(30);
                this.pauseMenuLayer.addChild(this.pauseMenu);

                this.fixedLayer.addChild(this.pauseMenuLayer, 10);
            },

            showMenu: function () {
                this.pauseMenuLayer.setVisible(true);
                this.tableLayer.pause();
                if (this.zoomTableLayer) {
                    this.zoomTableLayer.pause();
                }
                if (this.controlBarBg) {
                    this.controlBarBg.setVisible(false);
                }
            },

            hideMenu: function () {
                this.pauseMenuLayer.setVisible(false);
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
            }
        });
});
