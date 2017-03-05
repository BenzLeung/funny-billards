/**
 * @file 语言选择
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

                var bg = new cc.LayerColor(cc.color.BLACK);
                this.addChild(bg, 1);

                var winSize = cc.director.getWinSize();

                var MENU_FONT_SIZE = 72;
                var MENU_COLOR = new cc.Color(128, 128, 128);
                var MENU_FONT = 'Helvetica Neue';

                var label;
                var item;
                var itemArray = [];
                var i;
                var languageList = i18n.getLanguageList();
                for (i in languageList) {
                    if (languageList.hasOwnProperty(i)) {
                        label = new cc.LabelTTF(languageList[i], MENU_FONT, MENU_FONT_SIZE);
                        label.setColor(MENU_COLOR);
                        item = new cc.MenuItemLabel(label, (function (locale) {
                            return function () {
                                i18n.setLanguage(locale, function () {
                                    require(['scenes/titleScene'], function (TitleScene) {
                                        cc.director.runScene(new TitleScene());
                                    });
                                });
                            };
                        })(i));
                        itemArray.push(item);
                    }
                }

                var menu = new cc.Menu(itemArray);
                menu.setContentSize(winSize.width / 2, winSize.height / 2);
                menu.setPosition(winSize.width / 2, winSize.height / 2);
                menu.alignItemsVerticallyWithPadding(15);

                bg.addChild(menu);
            }
        });
    }
);
