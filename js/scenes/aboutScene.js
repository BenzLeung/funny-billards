/**
 * @file 关于游戏
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/2/7
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

define(
    [
        'cocos',
        'i18n/i18n'
    ],
    function (cc, i18n) {
        return cc.Scene.extend({
            ctor:function () {
                this._super();

                this.fixedLayer = new cc.LayerColor(cc.color(0, 0, 0));
                if (cc.sys.isMobile && cc._renderType === cc.game.RENDER_TYPE_CANVAS) {
                    this.fixedLayer.setPosition(cc.visibleRect.bottomLeft);
                    this.fixedLayer.setContentSize(cc.visibleRect.width, cc.visibleRect.height);
                }
                this.addChild(this.fixedLayer);

                var v = cc.visibleRect;

                var ABOUT_FONT_SIZE = cc.sys.isMobile ? 60 : 40;
                var ABOUT_WIDTH = cc.sys.isMobile ? cc.visibleRect.width - 100 : cc.visibleRect.width / 2;
                var about = new cc.LabelTTF(
                    i18n('这是一个普通的台球游戏，我开发这个游戏的目的是学习 cocos2d-js 游戏开发，以及 chipmunk 物理引擎。' +
                        '同时实践 Web Audio API。\n\n因为我觉得 cocos 自带的音频功能不好用，所以自行开发了一个简便的音频引擎。'),
                    i18n.defaultFont, ABOUT_FONT_SIZE, cc.size(ABOUT_WIDTH, 0), cc.TEXT_ALIGNMENT_LEFT);
                about.setPosition(v.width / 2, v.height * 0.6875);
                about.setColor(new cc.Color(192, 192, 192, 1));
                this.fixedLayer.addChild(about, 1);


                var MENU_FONT_SIZE = cc.sys.isMobile ? 72 : 50;
                var MENU_COLOR = new cc.Color(0, 255, 0);

                var benzLeung = new cc.LabelTTF(i18n('访问我的 Github'), i18n.defaultFont, MENU_FONT_SIZE);
                benzLeung.setColor(MENU_COLOR);
                var benzLeungMenuItem = new cc.MenuItemLabel(benzLeung, function () {
                    window.open('https://github.com/BenzLeung');
                });

                var site = new cc.LabelTTF(i18n('访问项目主页'), i18n.defaultFont, MENU_FONT_SIZE);
                site.setColor(MENU_COLOR);
                var siteMenuItem = new cc.MenuItemLabel(site, function () {
                    window.open('https://github.com/BenzLeung/funny-billards');
                });

                var goBack = new cc.LabelTTF(i18n('<< 返回'), i18n.defaultFont, MENU_FONT_SIZE);
                goBack.setColor(MENU_COLOR);
                var goBackMenuItem = new cc.MenuItemLabel(goBack, function () {
                    cc.director.popScene();
                });

                var menu = new cc.Menu(siteMenuItem, benzLeungMenuItem, goBackMenuItem);
                menu.setContentSize(v.width / 2, v.height / 2);
                menu.setPosition(v.width / 2, v.height / 4);
                menu.alignItemsVerticallyWithPadding(15);

                this.fixedLayer.addChild(menu);
            }
        });
    }
);
