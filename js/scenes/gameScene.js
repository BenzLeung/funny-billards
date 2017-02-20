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
            var tableLayer = new TableLayer();
            this.addChild(tableLayer);
        }
    });
});