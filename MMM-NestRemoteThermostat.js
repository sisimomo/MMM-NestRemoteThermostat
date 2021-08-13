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
		fanIconSize: undefined,
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
			this.file('thermostatDial.js')
		];
	},

	getStyles() {
		return [
			this.file('thermostatDial.css')
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
				this.thermostat.targetTemperature = this.newValues.targetTemperature;
			}
			if (this.newValues.ambientTemperature) {
				this.thermostat.ambientTemperature = this.newValues.ambientTemperature;
			}
			if (this.newValues.hvacState) {
				this.thermostat.hvacState = this.newValues.hvacState;
			}
			if (this.newValues.fanSpeed) {
				this.thermostat.fanSpeed = this.newValues.fanSpeed;
			}
			if (this.newValues.loading) {
				this.thermostat.loading = this.newValues.loading;
			}
			this.newValues = {};
		} else {
			this.thermostatDiv = document.createElement('div');

			const translateLocal = (str) => {
				return this.translate(str);
			}

			this.thermostat = new thermostatDial(this.thermostatDiv, translateLocal, this.config, {
				fanSpeeds: [ './modules/MMM-NestRemoteThermostat/images/fanIconSpeed1.gif', './modules/MMM-NestRemoteThermostat/images/fanIconSpeed2.gif', './modules/MMM-NestRemoteThermostat/images/fanIconSpeed3.gif', './modules/MMM-NestRemoteThermostat/images/fanIconSpeed4.gif', './modules/MMM-NestRemoteThermostat/images/fanIconSpeed5.gif' ],
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
					hvacState: payload.hvacState,
					fanSpeed: payload.fanSpeed,
					loading: payload.loading
				};
				Log.info('MMM-NestRemoteThermostat with thermostatId: "' + this.config.thermostatId + '" just receive new values.', this.newValues);

				this.updateDom();
			}
		}
	}
});
