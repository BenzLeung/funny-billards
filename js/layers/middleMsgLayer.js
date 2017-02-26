/**
 * @file 游戏中的提示信息
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/2/26
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

define(['cocos'], function (cc) {
    return cc.Layer.extend({
        ctor :function () {
            this._super();
            this.setContentSize(cc.visibleRect.width, cc.visibleRect.height);


        }
    });
});