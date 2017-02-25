/**
 * @file 力度按钮
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/2/25
 * @class ForceButton
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

define(['cocos', 'i18n/i18n'], function (cc, i18n) {
    return cc.ControlButton.extend({
        ctor: function () {
            this.bgSprite = new cc.Sprite('res/btn-force.png');
            this.bgSpriteForDisabled = new cc.Sprite('res/btn-force-disabled.png');

            // 不知道 cc.ControlButton 竟然有坑！这两句是用来填坑的
            var size = this.bgSprite.getContentSize();
            this.bgSprite.getPreferredSize = this.bgSpriteForDisabled.getPreferredSize = function () {
                return size;
            };

            this.titleLabel = new cc.LabelTTF(i18n('力度') + ' 100', i18n.defaultFont, 48);

            this._super(this.titleLabel, this.bgSprite);
            this.setAdjustBackgroundImage(false);
            this.setBackgroundSpriteForState(this.bgSpriteForDisabled, cc.CONTROL_STATE_DISABLED);
        },

        setForceNumber: function (num) {
            num = Math.round(num);
            this.setTitleForState(i18n('力度') + ' ' + num, cc.CONTROL_STATE_NORMAL);
            this.setTitleForState(i18n('力度') + ' ' + num, cc.CONTROL_STATE_HIGHLIGHTED);
            this.setTitleForState(i18n('力度') + ' ' + num, cc.CONTROL_STATE_DISABLED);
            this.setTitleForState(i18n('力度') + ' ' + num, cc.CONTROL_STATE_SELECTED);
        }
    });
});