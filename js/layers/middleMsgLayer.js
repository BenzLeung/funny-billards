/**
 * @file 游戏中的提示信息
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/2/26
 * @class MiddleMsgLayer
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

define(['cocos', 'i18n/i18n'], function (cc, i18n) {
    return cc.Layer.extend({
        ctor :function () {
            this._super();
            var v = cc.visibleRect;
            this.setContentSize(v.width, v.height);

            this.initGoalMsg();
            this.initComboMsg();
        },

        initGoalMsg: function () {
            var v = cc.visibleRect;

            this.goalLabel = new cc.LabelTTF(i18n('进球'), i18n.defaultFont, 96);
            this.goalLabel.setColor(cc.color(255, 255, 255));
            this.goalNumberLabel = new cc.LabelTTF('x2', i18n.defaultFont, 96);
            this.goalNumberLabel.setColor(cc.color(0, 255, 0));
            this.goalNumberLabel.enableStroke(new cc.Color(0, 128, 0), 5);

            var goalLabelSize = this.goalLabel.getContentSize();
            var goalNumberLabelSize = this.goalNumberLabel.getContentSize();
            this.goalLabel.setPosition((v.width - goalNumberLabelSize.width) / 2 - 16, v.height / 2 + 140);
            this.goalNumberLabel.setPosition((v.width + goalLabelSize.width) / 2 + 16, v.height / 2 + 140);

            this.goalLabel.setVisible(false);
            this.goalNumberLabel.setVisible(false);

            this.addChild(this.goalLabel);
            this.addChild(this.goalNumberLabel);

            cc.eventManager.addCustomListener('table:goal', function (data) {
                var goalBalls = data.getUserData()['goals'];
                var goalNum = goalBalls.length;
                if (goalNum < 2) {return;}
                this.goalNumberLabel.setString('x' + goalNum);
                this.goalNumberLabel.setScale(2);
                this.goalNumberLabel.setOpacity(255);
                this.goalLabel.setOpacity(255);
                this.goalNumberLabel.runAction(cc.sequence([cc.show(), cc.scaleTo(0.4, 1), cc.delayTime(1), cc.fadeOut(0.4), cc.hide()]));
                this.goalLabel.runAction(cc.sequence([cc.show(), cc.delayTime(1.4), cc.fadeOut(0.4), cc.hide()]));
            }.bind(this));
        },

        initComboMsg: function () {
            var v = cc.visibleRect;

            this.comboLabel = new cc.LabelTTF(i18n('连击'), i18n.defaultFont, 96);
            this.comboLabel.setColor(cc.color(255, 255, 255));
            this.comboNumberLabel = new cc.LabelTTF('3', i18n.defaultFont, 112);
            this.comboNumberLabel.setColor(cc.color(255, 255, 0));
            this.comboNumberLabel.enableStroke(new cc.Color(255, 128, 0), 5);

            var comboLabelSize = this.comboLabel.getContentSize();
            var comboNumberLabelSize = this.comboNumberLabel.getContentSize();
            this.comboLabel.setPosition((v.width + comboNumberLabelSize.width) / 2 + 16, v.height / 2);
            this.comboNumberLabel.setPosition((v.width - comboLabelSize.width) / 2 - 16, v.height / 2 + 8);

            this.comboLabel.setVisible(false);
            this.comboNumberLabel.setVisible(false);

            this.addChild(this.comboLabel);
            this.addChild(this.comboNumberLabel);

            cc.eventManager.addCustomListener('table:goal', function (data) {
                var combo = data.getUserData()['combo'];
                if (combo < 2) {return;}
                this.comboNumberLabel.setString(combo);
                this.comboNumberLabel.setScale(2);
                this.comboNumberLabel.setOpacity(255);
                this.comboLabel.setOpacity(255);
                this.comboNumberLabel.runAction(cc.sequence([cc.show(), cc.scaleTo(0.4, 1), cc.delayTime(1), cc.fadeOut(0.4), cc.hide()]));
                this.comboLabel.runAction(cc.sequence([cc.show(), cc.delayTime(1.4), cc.fadeOut(0.4), cc.hide()]));
            }.bind(this));
        }
    });
});