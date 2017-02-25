/**
 * @file 用来瞄准球的光标
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/2/22
 * @class BallCustom
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

define(['cocos'], function (cc) {
    return cc.DrawNode.extend({
        ctor: function (radius) {
            this._super();
            radius = radius || 40;

            this.setContentSize(radius * 2, radius * 2);
            this.setAnchorPoint(0.5, 0.5);
            this.ignoreAnchorPointForPosition(false);

            // 圆心点，半径，弧度，分段(越大越接近圆)，圆心点到弧度的线是否显示，线条宽度，颜色
            this.drawCircle(cc.p(radius, radius), radius - 1, 0, radius * 4, false, 2, cc.color(255, 255, 255));

            // 起点，终点，线条宽度，线条颜色
            this.drawSegment(cc.p(radius - 5, radius), cc.p(radius + 5, radius), 1, cc.color(255, 255, 255));
            this.drawSegment(cc.p(radius, radius - 5), cc.p(radius, radius + 5), 1, cc.color(255, 255, 255));

            this.theCanvas = document.getElementById(cc.game.config['id']);

            this.setVisible(false);
        },

        setVisible: function (visible) {
            this._super(visible);

            // 若显示这个光标，则隐藏鼠标指针
            this.theCanvas.style.cursor = visible ? 'none' : 'default';
        }
    });
});
