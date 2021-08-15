class NestThermostat {
	constructor({ targetElement, translateFn, options, properties }) {
		this.dom = {};
		this.domHelper = {};
		this.dom.targetElement = targetElement;
		this.translate = translateFn;

		/*
		 * Options
		 */
		this.options = {
			diameter				: options.diameter 					|| 400,		// The diamiter of the dial. Dosen't affect the size of the dial but the size of the elements on the dials.
			minValue				: options.minValue 					|| 10, 		// Minimum value for target temperature
			maxValue				: options.maxValue 					|| 30, 		// Maximum value for target temperature
			numTicks				: options.numTicks 					|| 120, 	// Number of tick lines to display around the dial
			fanIconSize				: options.fanIconSize				|| 50,		// Size in px of the fan icon
			largeBarThickness		: options.largeBarThickness			|| 2.5,		// Increase of tick line size in pixel
			roundTargetTemperature	: options.roundTargetTemperature != undefined ? options.roundTargetTemperature : true, 	// If you have to round the target temperature to closest 0.5
			roundAmbientTemperature	: options.roundAmbientTemperature != undefined ? options.roundAmbientTemperature : true,	// If you have to round the ambient temperature to closest 0.5
		};

		/*
		 * Properties - calculated from options in many cases
		 */
		this.properties = {
			tickDegrees			: properties.tickDegrees || 300, //  Degrees of the dial that should be covered in tick lines
			rangeValue			: properties.rangeValue || this.options.maxValue - this.options.minValue,
			radius				: properties.radius || this.options.diameter/2,
			ticksOuterRadius	: properties.ticksOuterRadius || this.options.diameter / 30,
			ticksInnerRadius	: properties.ticksInnerRadius || this.options.diameter / 8,
			hvacStates			: properties.hvacStates || ['off', 'heating', 'cooling', 'fan', 'dry' ],
			fanSpeeds			: properties.fanSpeeds || [ 'images/fanIconSpeed1.gif', 'images/fanIconSpeed2.gif', 'images/fanIconSpeed3.gif', 'images/fanIconSpeed4.gif', 'images/fanIconSpeed5.gif' ],
			dragLockAxisDistance: properties.dragLockAxisDistance || 15
		}
		this.properties.lblAmbientPosition = [ this.properties.radius, this.properties.ticksOuterRadius - (this.properties.ticksOuterRadius - this.properties.ticksInnerRadius) / 2 ]
		this.properties.offsetDegrees = 180 - (360 - this.properties.tickDegrees) / 2;

		/*
		 * Object state
		 */
		this.state = {
			targetTemperature: this.options.minValue,
			ambientTemperature: this.options.minValue,
			hvacState: this.properties.hvacStates[0],
			fanSpeed: 0,
			loading: true
		};

		this.createDom();
		this.updateDom();
	}

	getTargetTemperature() {
		return this.state.targetTemperature;
	}

	setTargetTemperature(targetTemperature) {
		if (!isNaN(targetTemperature))  {
			this.state.targetTemperature = NestThermostat.restrictToRange((this.options.roundTargetTemperature ? NestThermostat.roundHalf(targetTemperature) : targetTemperature));
			this.state.loading = false;
			this.updateDom();
		}
	}

	getAmbientTemperature() {
		return this.state.ambientTemperature;
	}

	setAmbientTemperature(ambientTemperature) {
		if (!isNaN(ambientTemperature))  {
			this.state.ambientTemperature = (this.options.roundAmbientTemperature ? NestThermostat.roundHalf(ambientTemperature) : ambientTemperature);
			this.state.loading = false;
			this.updateDom();
		}
	}

	getHvacState() {
		return this.state.hvacState;
	}

	setHvacState(hvacState) {
		if (this.properties.hvacStates.indexOf(hvacState) >= 0) {
			this.state.hvacState = hvacState;
			this.state.loading = false;
			this.updateDom();
		}
	}

	getFanSpeed() {
		return this.state.fanSpeed;
	}

	setFanSpeed(fanSpeed) {
		fanSpeed = typeof fanSpeed == "string" ? parseInt(fanSpeed) : fanSpeed;
		if (fanSpeed ? (fanSpeed <= this.properties.fanSpeeds.length && fanSpeed >= 0) : false) {
			this.state.fanSpeed = fanSpeed;
			this.state.loading = false;
			this.updateDom();
		}
	}

	getLoading() {
		return this.state.loading;
	}

	setLoading(loading) {
		if (typeof loading == "boolean") {
			this.state.loading = loading;
			this.updateDom();
		}
	}

	static getArrayOfExpostant() {
		return [ '⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹' ];
	}

	/*
	* CREATE DOM
	*/

	createDom() {
		/*
		 * SVG
		 */
		this.dom.svg = NestThermostat.createSVGElement('svg', {
			width: '100%',
			height: '100%',
			viewBox: '0 0 ' + this.options.diameter + ' ' + this.options.diameter,
			class: 'dial'
		}, this.dom.targetElement);
		// CIRCULAR DIAL
		NestThermostat.createSVGElement('circle', {
			cx: this.properties.radius,
			cy: this.properties.radius,
			r: this.properties.radius,
			class: 'dial__shape'
		}, this.dom.svg);
		// EDITABLE INDICATOR
		NestThermostat.createSVGElement('path', {
			d: NestThermostat.donutPath(this.properties.radius, this.properties.radius, this.properties.radius - 4, this.properties.radius - 8),
			class: 'dial__editableIndicator',
		}, this.dom.svg);

		/*
		 * Ticks
		 */
		this.dom.ticks = NestThermostat.createSVGElement('g',{
			class: 'dial__ticks'
		}, this.dom.svg);
		this.domHelper.tickPoints = [
			[ this.properties.radius - 1, this.properties.ticksOuterRadius],
			[ this.properties.radius + 1, this.properties.ticksOuterRadius],
			[ this.properties.radius + 1, this.properties.ticksInnerRadius],
			[ this.properties.radius - 1, this.properties.ticksInnerRadius]
		];
		this.domHelper.tickPointsLarge = [
			[this.properties.radius - this.options.largeBarThickness, this.properties.ticksOuterRadius],
			[this.properties.radius + this.options.largeBarThickness, this.properties.ticksOuterRadius],
			[this.properties.radius + this.options.largeBarThickness, this.properties.ticksInnerRadius + 20],
			[this.properties.radius - this.options.largeBarThickness, this.properties.ticksInnerRadius + 20]
		];
		this.domHelper.theta = this.properties.tickDegrees / this.options.numTicks;
		this.dom.tickArray = [];
		for (let iTick = 0; iTick < this.options.numTicks; iTick++) {
			this.dom.tickArray.push(NestThermostat.createSVGElement('path', {
				d: NestThermostat.pointsToPath(this.domHelper.tickPoints)
			}, this.dom.ticks));
		}

		/*
		 * Labels
		 */

		// lblTarget
		this.dom.lblTarget = NestThermostat.createSVGElement('text', {
			x: this.properties.radius,
			y: this.properties.radius,
			class: 'dial__lbl dial__lbl--target'
		}, this.dom.svg);
		this.dom.lblTargetText = document.createTextNode('');
		this.dom.lblTarget.appendChild(this.dom.lblTargetText);

		// lblTargetHalf
		this.dom.lblTargetHalf = NestThermostat.createSVGElement('text', {
			x: this.properties.radius + this.properties.radius / 2.5,
			y: this.properties.radius - this.properties.radius / 8,
			class: 'dial__lbl dial__lbl--target--half'
		}, this.dom.svg);
		this.dom.lblTargetHalfText = document.createTextNode('');
		this.dom.lblTargetHalf.appendChild(this.dom.lblTargetHalfText);

		// lblAmbient
		this.dom.lblAmbient = NestThermostat.createSVGElement('text', {
			class: 'dial__lbl dial__lbl--ambient'
		}, this.dom.svg);
		this.dom.lblAmbientText = document.createTextNode('');
		this.dom.lblAmbient.appendChild(this.dom.lblAmbientText);

		// lblLoading
		this.dom.lblLoading = NestThermostat.createSVGElement('text', {
			x: this.properties.radius,
			y: this.properties.radius,
			class: 'dial__lbl dial__lbl--loading'
		}, this.dom.svg);
		this.dom.lblLoadingText = document.createTextNode(this.translate('loading'));
		this.dom.lblLoading.appendChild(this.dom.lblLoadingText);

		// lblHvacState
		this.dom.lblHvacState = NestThermostat.createSVGElement('text', {
			x: this.properties.radius,
			y: (this.properties.radius/8) * 5,
			class: 'dial__lbl dial__lbl--hvac-state'
		}, this.dom.svg);
		this.dom.lblHvacStateText = document.createTextNode('');
		this.dom.lblHvacState.appendChild(this.dom.lblHvacStateText);

		// lblFanSpeedImage
		this.dom.lblFanSpeedImage = NestThermostat.createSVGElement('image', {
			height: this.options.fanIconSize,
			width: this.options.fanIconSize,
			x: this.properties.radius - (this.options.fanIconSize/2),
			y: this.properties.radius + ((this.properties.radius/16) * 10) - (this.options.fanIconSize/2),
			class: 'dial__lbl dial__lbl--fan-speed-icon'
		}, this.dom.svg);

		// lblFanSpeedCircle
		NestThermostat.createSVGElement('circle', {
			cx: this.properties.radius + this.options.fanIconSize/2.75,
			cy: (this.properties.radius + ((this.properties.radius/16) * 10)) - (this.options.fanIconSize/2) + ((this.options.fanIconSize/16) * 13),
			r: this.options.fanIconSize/4,
			class: 'dial__shape dial--state--off'
		}, this.dom.svg);

		// lblFanSpeedLabel
		this.dom.lblFanSpeedLabel = NestThermostat.createSVGElement('text', {
			x: this.properties.radius + this.options.fanIconSize/2.75,
			y: (this.properties.radius + ((this.properties.radius/16) * 10)) - (this.options.fanIconSize/2) + ((this.options.fanIconSize/16) * 13),
			"font-size": ((this.options.fanIconSize/32)*13) + "px",
			class: 'dial__lbl dial__lbl--fan-speed-label'
		}, this.dom.svg);
		this.dom.lblFanSpeedLabelText = document.createTextNode(this.state.fanSpeed);
		this.dom.lblFanSpeedLabel.appendChild(this.dom.lblFanSpeedLabelText);
	}


	/*
	* UPDATE DOM
	*/
	updateDom() {
		this.updateDomLoading();
		this.updateDomHvacState();
		this.updateDomTicks();
		this.updateDomTargetTemperature();
		this.updateDomAmbientTemperature();
		this.updateDomFanSpeed();
	}

	/*
	* UPDATE DOM - ticks
	*/
	updateDomTicks() {
		let vMin, vMax;

		if (this.state.loading) {
			vMin = this.options.minValue;
			vMax = vMin;
		} else {
			vMin = Math.min(this.state.ambientTemperature, this.state.targetTemperature);
			vMax = Math.max(this.state.ambientTemperature, this.state.targetTemperature);
		}

		let min = NestThermostat.restrictToRange(Math.round((vMin - this.options.minValue) / this.properties.rangeValue * this.options.numTicks), 0, this.options.numTicks-1);
		let max = NestThermostat.restrictToRange(Math.round((vMax - this.options.minValue) / this.properties.rangeValue * this.options.numTicks), 0, this.options.numTicks-1);

		this.dom.tickArray.forEach((tick,iTick) => {
			let isLarge = this.state.loading ? false : iTick==min || iTick==max;
			let isActive = this.state.loading ? false : iTick >= min && iTick <= max;
			NestThermostat.attr(tick, {
				d: NestThermostat.pointsToPath(NestThermostat.rotatePoints(isLarge ? this.domHelper.tickPointsLarge: this.domHelper.tickPoints, iTick * this.domHelper.theta - this.properties.offsetDegrees, [ this.properties.radius, this.properties.radius ])),
				class: isActive ? 'active' : ''
			});
		});
	}

	/*
	 * UPDATE DOM - ambient temperature
	 */
	updateDomAmbientTemperature() {
		this.dom.lblAmbientText.nodeValue = Math.floor(this.state.ambientTemperature);
		if (this.state.ambientTemperature  % 1 != 0) {
			this.dom.lblAmbientText.nodeValue += NestThermostat.getArrayOfExpostant()[NestThermostat.getFirstDecimalAsNumber(this.state.ambientTemperature)];
		}
		let peggedValue = NestThermostat.restrictToRange(this.state.ambientTemperature, this.options.minValue, this.options.maxValue);
		let degs = this.properties.tickDegrees * (peggedValue - this.options.minValue) / this.properties.rangeValue - this.properties.offsetDegrees;
		if (peggedValue > this.state.targetTemperature) {
			degs += 8;
		} else {
			degs -= 8;
		}
		let pos = NestThermostat.rotatePoint(this.properties.lblAmbientPosition, degs, [ this.properties.radius, this.properties.radius ]);
		NestThermostat.attr(this.dom.lblAmbient,{
			x: pos[0],
			y: pos[1]
		});
	}

	/*
	 * UPDATE DOM - target temperature
	 */
	updateDomTargetTemperature() {
		this.dom.lblTargetText.nodeValue = Math.floor(this.state.targetTemperature);
		NestThermostat.setClass(this.dom.lblTargetHalf, 'shown', this.state.targetTemperature % 1 != 0);
		this.dom.lblTargetHalfText.nodeValue = NestThermostat.getFirstDecimalAsNumber(this.state.targetTemperature);
	}

	/*
	* UPDATE DOM - HVAC state
	*/
	updateDomHvacState() {
		this.dom.svg.classList.forEach((c) => {
			if (c.match(/^dial--state--/)) {
				this.dom.svg.classList.remove(c);
			}
		});
		this.dom.svg.classList.add('dial--state--' + this.state.hvacState);
		this.dom.lblHvacStateText.nodeValue = this.translate(this.state.hvacState.toLowerCase()).toUpperCase();
	}

	/*
	 * UPDATE DOM - loading
	 */
	updateDomLoading() {
		this.dom.svg.classList[this.state.loading ? 'add' : 'remove']('loading');
	}

	/*
	 * UPDATE DOM - fan speed
	 */
	updateDomFanSpeed() {
		this.dom.lblFanSpeedLabelText.nodeValue = this.state.fanSpeed;
		if (this.state.fanSpeed != 0 && this.state.hvacState.toLowerCase() != 'off') {
			NestThermostat.attr(this.dom.lblFanSpeedImage, { style: '' });
			NestThermostat.attr(this.dom.lblFanSpeedLabel, { style: '' });
			// prevent restarting the gif animation each render if gif dosen't change
			if (this.dom.lblFanSpeedImage.getAttribute('href') != this.properties.fanSpeeds[this.state.fanSpeed-1]) {
				NestThermostat.attr(this.dom.lblFanSpeedImage, { href: this.properties.fanSpeeds[this.state.fanSpeed-1] });
			}
		} else {
			NestThermostat.attr(this.dom.lblFanSpeedImage,{ style: 'opacity: 0' });
			NestThermostat.attr(this.dom.lblFanSpeedLabel,{ style: 'opacity: 0' });
		}
	}

	/*
	 * Utility functions
	 */

	// Create an element with proper SVG namespace, optionally setting its attributes and appending it to another element
	static createSVGElement(tag, attributes, appendTo) {
		let element = document.createElementNS('http://www.w3.org/2000/svg', tag);
		NestThermostat.attr(element, attributes);
		if (appendTo) {
			appendTo.appendChild(element);
		}
		return element;
	}

	// Set attributes for an element
	static attr(element, attrs) {
		for (let i in attrs) {
			element.setAttribute(i,attrs[i]);
		}
	}

	// Rotate a cartesian point about given origin by X degrees
	static rotatePoint(point, angle, origin) {
		let radians = angle * Math.PI/180;
		let x = point[0]-origin[0];
		let y = point[1]-origin[1];
		let x1 = x * Math.cos(radians) - y * Math.sin(radians) + origin[0];
		let y1 = x * Math.sin(radians) + y * Math.cos(radians) + origin[1];
		return [x1,y1];
	}

	// Rotate an array of cartesian points about a given origin by X degrees
	static rotatePoints(points, angle, origin) {
		return points.map(function(point) {
			return NestThermostat.rotatePoint(point, angle, origin);
		});
	}

	// Given an array of points, return an SVG path string representing the shape they define
	static pointsToPath(points) {
		return points.map(function(point, iPoint) {
			return (iPoint > 0 ? 'L' : 'M') + point[0] + ' ' + point[1];
		}).join(' ') + 'Z';
	}

	// Return a circle Path
	static circleToPath(cx, cy, r) {
		return [
			"M", cx, ",", cy,
			"m", 0 - r, ",", 0,
			"a", r, ",", r, 0, 1, ",", 0, r * 2 , ",", 0,
			"a", r, ",", r, 0, 1, ",", 0, 0 - r * 2, ",", 0,
			"z"
		].join(' ').replace(/\s,\s/g,",");
	}

	// Return a donutPath
	static donutPath(cx, cy, rOuter, rInner) {
		return NestThermostat.circleToPath(cx,cy,rOuter) + " " + NestThermostat.circleToPath(cx, cy, rInner);
	}

	// Restrict a number to a min + max range
	static restrictToRange(val, min, max) {
		if (val < min) return min;
		if (val > max) return max;
		return val;
	}

	// Round a number to the nearest 0.5
	static roundHalf(num) {
		return Math.round(num*2)/2;
	}

	// Extract the first decimal as a number
	static getFirstDecimalAsNumber(value) {
		return Math.round((value % 1) * 10);
	}

	// Add or remove class of element
	static setClass(el, className, state) {
		el.classList[ state ? 'add' : 'remove' ](className);
	}
}