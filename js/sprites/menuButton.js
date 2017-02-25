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
        }
    });
});