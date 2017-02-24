/**
 * @file 游戏主场景
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/2/20
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

define(
    [
        'cocos',
        'layers/tableLayer',
        'layers/zoomTableLayer'
    ],
    function (cc, TableLayer, ZoomTableLayer) {
    return cc.Scene.extend({
        ctor: function () {
            this._super();

            if (cc.sys.capabilities['touches']) {
                this.zoomTableLayer = new ZoomTableLayer();
                this.tableLayer = this.zoomTableLayer.tableLayer;

                this.zoomTableLayer.setPosition(cc.visibleRect.bottomLeft);
                this.zoomTableLayer.setContentSize(cc.visibleRect.width, cc.visibleRect.height);
                this.addChild(this.zoomTableLayer);
                this.initTouch();
            } else {
                this.tableLayer = new TableLayer();
                this.tableLayer.setPosition(
                    (cc.visibleRect.width - TableLayer.TABLE_WIDTH) / 2,
                    (cc.visibleRect.height - TableLayer.TABLE_HEIGHT) / 2);
                this.addChild(this.tableLayer);
                this.initMouse();
            }
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
            cc.eventManager.addCustomListener('table:status_running', function () {
                this.tableLayer.hideAimLine();
            }.bind(this));
        },

        initTouch: function () {
            var shootLabel = new cc.LabelTTF('发射!', 'Microsoft Yahei', 100);
            this.shootButton = new cc.MenuItemLabel(shootLabel, function () {
                if (this.tableLayer.status !== TableLayer.STATUS_READY) return;
                this.zoomTableLayer.resetTable(true);
                this.tableLayer.shootMasterBall();
            }, this);
            var shootButtonMenu = new cc.Menu(this.shootButton);

            var winSize = cc.director.getWinSize();
            shootButtonMenu.setContentSize(cc.visibleRect.width, 130);
            shootButtonMenu.setPosition(winSize.width / 2, cc.visibleRect.bottom.y + 70);
            this.addChild(shootButtonMenu);

            this.tableLayer.setAimLine(cc.p(TableLayer.TABLE_WIDTH / 2, TableLayer.TABLE_HEIGHT / 2));

            // 鼠标和触屏的控制光标的方式不一样，因此显示/隐藏光标的逻辑也不一样，于是分别写
            cc.eventManager.addCustomListener('table:status_ready', function () {
                this.tableLayer.setAimLine(this.tableLayer.ballCursor.getPosition());
            }.bind(this));
            cc.eventManager.addCustomListener('table:status_running', function () {
                this.tableLayer.hideAimLine();
            }.bind(this));
        }
    });
});