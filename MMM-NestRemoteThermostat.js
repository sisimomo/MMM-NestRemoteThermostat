/*
* Magic Mirror Module: MMM-NestRemoteThermostat (https://github.com/sisimomo/MMM-NestRemoteThermostat)
* By Simon Vallières (https://www.linkedin.com/in/simon-vallieres-358555187/)
*
* Base on Magic Mirror Module: MMM-RemoteTemperature (https://github.com/balassy/MMM-RemoteTemperature)
* By György Balássy (https://www.linkedin.com/in/balassy)
*
* Base on codepen.io example: https://codepen.io/dalhundal/pen/KpabZB
* By Dal Hundal (https://codepen.io/dalhundal)
*
* MIT Licensed.
*/

Module.register('MMM-NestRemoteThermostat', {
	defaults: {
		thermostatId: null,
		diameter: undefined,
		minValue: undefined,
		maxValue: undefined,
		numTicks: undefined,
		iconSize: undefined,
		largeBarThickness: undefined,
		roundTargetTemperature: undefined,
		roundAmbientTemperature: undefined,
		language: config.language,
		width: '5em',
		height: '5em',
	},

	requiresVersion: '2.1.0',

	getScripts() {
		return [
			this.file('NestThermostat.js')
		];
	},

	getStyles() {
		return [
			this.file('NestThermostat.css')
		];
	},

	getTranslations() {
		return {
			en: 'translations/en.json',
			fr: 'translations/fr.json'
		};
	},

	start() {
		this.newValues = {};
		this.sendSocketNotification('MMM-NestRemoteThermostat.INIT', {
			thermostatId: this.config.thermostatId
		});
	},

	getDom() {
		if (this.thermostat) {
			if (this.newValues.targetTemperature) {
				this.thermostat.setTargetTemperature(this.newValues.targetTemperature);
			}
			if (this.newValues.ambientTemperature) {
				this.thermostat.setAmbientTemperature(this.newValues.ambientTemperature);
			}
			if (this.newValues.state) {
				this.thermostat.setState(this.newValues.state);
			}
			if (this.newValues.power) {
				this.thermostat.setPower(this.newValues.power);
			}
			if (this.newValues.icon) {
				this.thermostat.setIcon(this.newValues.icon);
			}
			this.thermostat.setLoading(this.newValues.loading);
			this.newValues = {};
		} else {
			this.thermostatDiv = document.createElement('div');

			this.thermostat = new NestThermostat({
				targetElement: this.thermostatDiv,
				translateFn: (str) => {
					return this.translate(str);
				},
				options: this.config,
				properties: {
					fanIcons:  [ this.file('/images/fanIconSpeed1.gif'), this.file('/images/fanIconSpeed2.gif'), this.file('/images/fanIconSpeed3.gif'), this.file('/images/fanIconSpeed4.gif'), this.file('/images/fanIconSpeed5.gif') ],
					radiatorIcon: this.file('/images/radiator.gif')
				}
			});

			this.thermostatDiv.style.width = this.config.width;
			this.thermostatDiv.style.height = this.config.height;
		}

		return this.thermostatDiv;
	},

	socketNotificationReceived(notificationName, payload) {
		if (notificationName === 'MMM-NestRemoteThermostat.VALUE_RECEIVED' && payload) {
			if (!this.config.thermostatId || (this.config.thermostatId && this.config.thermostatId === payload.thermostatId)) {
				this.newValues = {
					targetTemperature: payload.targetTemperature,
					ambientTemperature: payload.ambientTemperature,
					state: payload.state,
					power: payload.power,
					icon: payload.icon,
					loading: payload.loading
				};
				Log.info('MMM-NestRemoteThermostat, thermostatId: "' + this.config.thermostatId + '" just receive new values.', this.newValues);

				this.updateDom();
			}
		}
	}
});
