/**
 * @file 游戏标题
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/3/5
 * @class TitleScene
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

define(
    [
        'cocos',
        'layers/titleLayer',
        'layers/startMenu'
    ],
    function (cc, TitleLayer, StartMenu) {
        return cc.Scene.extend({
            ctor:function () {
                this._super();

                this.fixedLayer = new cc.LayerColor(cc.color(0, 0, 0));
                if (cc.sys.isMobile && cc._renderType === cc.game.RENDER_TYPE_CANVAS) {
                    this.fixedLayer.setPosition(cc.visibleRect.bottomLeft);
                    this.fixedLayer.setContentSize(cc.visibleRect.width, cc.visibleRect.height);
                }
                this.addChild(this.fixedLayer);

                var title = new TitleLayer();
                this.fixedLayer.addChild(title, 3);

                var menu = new StartMenu();
                this.fixedLayer.addChild(menu, 5);

                var benzLeung = new cc.LabelTTF('©Benz Leung (https://github.com/BenzLeung)', 'Tahoma', 45);
                benzLeung.setColor(new cc.Color(128, 128, 128, 1));
                benzLeung.setPosition(cc.visibleRect.width / 2, 60);
                this.fixedLayer.addChild(benzLeung, 3);
            }
        });
    }
);
