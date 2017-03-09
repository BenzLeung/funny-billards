/**
 * @file 控制力度的滑动条
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/2/26
 * @class ForceSlider
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

define(['cocos'], function (cc) {
    return cc.ControlSlider.extend({
        ctor: function () {
            this._super('res/slider-background.png', 'res/slider-progress.png', 'res/slider-thumb.png');
            this.setMinimumValue(10);
            this.setMaximumValue(100);
            this.setValue(100);
            this.isAllowTouch = true;
        },

        setAllowTouch: function (a) {
            this.isAllowTouch = a;
        },

        isTouchInside: function (touch) {
            if (this.isAllowTouch) {
                return this._super(touch);
            } else {
                return false;
            }
        }
    });
});