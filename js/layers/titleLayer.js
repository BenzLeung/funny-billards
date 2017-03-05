/**
 * @file 开始画面层
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/3/5
 * @class TitleLayer
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

define(
    [
        'cocos'
    ],
    function (cc) {

        return cc.Layer.extend({
            ctor:function () {
                this._super();
                this.titleImage = new cc.Sprite('res/title.png');
                this.titleImage.setPosition(cc.visibleRect.width / 2, cc.visibleRect.height * 0.75);
                this.addChild(this.titleImage);
            }
        });
    }
);
