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
        'layers/tableLayer'
    ],
    function (cc, TableLayer) {
    return cc.Scene.extend({
        ctor: function () {
            this._super();
            this.tableLayer = new TableLayer();

            this.tableLayer.setPosition(
                (cc.visibleRect.width - TableLayer.TABLE_WIDTH) / 2,
                (cc.visibleRect.height - TableLayer.TABLE_HEIGHT) / 2);

            this.addChild(this.tableLayer);

            if (cc.sys.capabilities['touches']) {
                this.initTouch();
            } else {
                this.initMouse();
            }
        },

        initMouse: function () {
            var mouseListener = cc.EventListener.create({
                event: cc.EventListener.MOUSE,
                onMouseMove: function (event) {
                    var target = event.getCurrentTarget();
                    if (target.status !== TableLayer.STATUS_WAIT) return false;
                    var pos = target.convertToNodeSpace(event.getLocation());
                    target.setAimLine(pos);
                },
                onMouseUp: function (event) {
                    var target = event.getCurrentTarget();
                    if (target.status !== TableLayer.STATUS_WAIT) return false;
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
            this.shootButton = new cc.LabelTTF('发射!', 'Microsoft Yahei', 100);
            this.shootButton.setPosition(cc.visibleRect.width / 2, 60);
            this.addChild(this.shootButton, 5);

            var touchListener = cc.EventListener.create({
                event: cc.EventListener.TOUCH_ONE_BY_ONE,
                onTouchBegan: function (touch, event) {
                    var target = event.getCurrentTarget();
                    var table = target.tableLayer;
                    if (table.status !== TableLayer.STATUS_WAIT) return false;
                    var shootButton = target.shootButton;
                    var shootButtonRect = shootButton.getBoundingBox();
                    var touchPos = touch.getLocation();
                    touchPos = cc.pSub(touchPos, cc.visibleRect.bottomLeft);
                    if (cc.rectContainsPoint(shootButtonRect, touchPos)) {
                        table.shootMasterBall();
                        return false;
                    }
                    return true;
                },
                onTouchMoved: function (touch, event) {
                    var target = event.getCurrentTarget();
                    var table = target.tableLayer;
                    if (table.status !== TableLayer.STATUS_WAIT) return false;
                    var delta = touch.getDelta();
                    var curPos = table.ballCursor.getPosition();
                    var theRect = cc.rect(
                        TableLayer.BALL_RADIUS,
                        TableLayer.BALL_RADIUS,
                        TableLayer.TABLE_WIDTH - TableLayer.BALL_RADIUS,
                        TableLayer.TABLE_HEIGHT - TableLayer.BALL_RADIUS
                    );
                    delta = cc.pMult(delta, 0.5);
                    curPos = cc.pAdd(curPos, delta);
                    curPos = cc.pClamp(curPos, cc.p(theRect.x, theRect.y), cc.p(theRect.width, theRect.height));
                    table.setAimLine(curPos);
                    return true;
                }
            });
            cc.eventManager.addListener(touchListener, this);
            this.tableLayer.setAimLine(cc.p(TableLayer.TABLE_WIDTH / 2, TableLayer.TABLE_HEIGHT / 2));

            // 鼠标和触屏的控制光标的方式不一样，因此显示/隐藏光标的逻辑也不一样，于是分别写
            cc.eventManager.addCustomListener('table:status_wait', function () {
                this.tableLayer.setAimLine(this.tableLayer.ballCursor.getPosition());
            }.bind(this));
            cc.eventManager.addCustomListener('table:status_running', function () {
                this.tableLayer.hideAimLine();
            }.bind(this));
        }
    });
});