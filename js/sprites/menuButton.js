/**
 * @file 显示菜单按钮
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/2/25
 * @class MenuButton
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

define(['cocos'], function (cc) {
    return cc.ControlButton.extend({
        ctor: function () {
            this.bgSprite = new cc.Sprite('res/btn-menu.png');

            // 不知道 cc.ControlButton 竟然有坑！这两句是用来填坑的
            var size = this.bgSprite.getContentSize();
            this.bgSprite.getPreferredSize = function () {
                return size;
            };
            this._super(this.bgSprite);
            this.setAdjustBackgroundImage(false);

            // cc.ControlButton 竟然还不支持鼠标！继续填坑，我以后再也不使用 cc.Control 了！
            this.theCanvas = document.getElementById(cc.game.config['id']);

            this.mouseListener = cc.EventListener.create({
                event: cc.EventListener.MOUSE,
                isInside: false,
                onMouseDown: function (event) {
                    var target = event.getCurrentTarget();
                    target.onTouchBegan(event, event);
                },
                onMouseMove: function (event) {
                    var target = event.getCurrentTarget();
                    if (target.isTouchInside(event) && target.isEnabled() && target.isVisible() && target.hasVisibleParents()) {
                        if (!this.isInside) {
                            this.isInside = true;
                            target.theCanvas.style.cursor = 'pointer';
                        }
                    } else {
                        if (this.isInside) {
                            this.isInside = false;
                            target.theCanvas.style.cursor = 'default';
                        }
                    }
                    target.onTouchMoved(event, event);
                },
                onMouseUp: function (event) {
                    var target = event.getCurrentTarget();
                    target.onTouchEnded(event, event);
                }
            });
        },

        onEnter: function () {
            this._super();
            cc.eventManager.addListener(this.mouseListener, this);
        }
    });
});