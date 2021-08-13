const bodyParser = require('body-parser');
const NodeHelper = require('node_helper');

module.exports = NodeHelper.create({
	start() {
		this.expressApp.use(bodyParser.json());
		this.expressApp.post('/remote-nest-thermostat', (req, res) => {
			const params = req.body;

			console.log(`MMM-NestRemoteThermostat Node helper: New message receive: `);
			console.log(JSON.stringify(params, null, 4))

			const payload = {
				thermostatId: params.thermostatId,
				targetTemperature: params.targetTemperature,
				ambientTemperature: params.ambientTemperature,
				hvacState: params.hvacState.toLowerCase(),
				fanSpeed: params.fanSpeed,
				loading: params.loading
			};

			res.send({"status": "success", "payload": payload,});

			this.sendSocketNotification('MMM-NestRemoteThermostat.VALUE_RECEIVED', payload);
		});
	},

	socketNotificationReceived(notificationName, payload) {
		if (notificationName === 'MMM-NestRemoteThermostat.INIT') {
			console.log(`MMM-NestRemoteThermostat Node helper: Init notification received from module for thermostat "${payload.thermostatId}".`); // eslint-disable-line no-console
		}
	},
});
