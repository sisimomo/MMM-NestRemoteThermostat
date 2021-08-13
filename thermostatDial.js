// https://codepen.io/dalhundal/pen/KpabZB
const thermostatDial = (function() {

	/*
	 * Utility functions
	 */

	// Create an element with proper SVG namespace, optionally setting its attributes and appending it to another element
	function createSVGElement(tag, attributes, appendTo) {
		let element = document.createElementNS('http://www.w3.org/2000/svg', tag);
		attr(element, attributes);
		if (appendTo) {
			appendTo.appendChild(element);
		}
		return element;
	}

	// Set attributes for an element
	function attr(element, attrs) {
		for (let i in attrs) {
			element.setAttribute(i,attrs[i]);
		}
	}

	// Rotate a cartesian point about given origin by X degrees
	function rotatePoint(point, angle, origin) {
		let radians = angle * Math.PI/180;
		let x = point[0]-origin[0];
		let y = point[1]-origin[1];
		let x1 = x * Math.cos(radians) - y * Math.sin(radians) + origin[0];
		let y1 = x * Math.sin(radians) + y * Math.cos(radians) + origin[1];
		return [x1,y1];
	}

	// Rotate an array of cartesian points about a given origin by X degrees
	function rotatePoints(points, angle, origin) {
		return points.map(function(point) {
			return rotatePoint(point, angle, origin);
		});
	}

	// Given an array of points, return an SVG path string representing the shape they define
	function pointsToPath(points) {
		return points.map(function(point, iPoint) {
			return (iPoint > 0 ? 'L' : 'M') + point[0] + ' ' + point[1];
		}).join(' ') + 'Z';
	}

	function circleToPath(cx, cy, r) {
		return [
			"M", cx, ",", cy,
			"m", 0 - r, ",", 0,
			"a", r, ",", r, 0, 1, ",", 0, r * 2 , ",", 0,
			"a", r, ",", r, 0, 1, ",", 0, 0 - r * 2, ",", 0,
			"z"
		].join(' ').replace(/\s,\s/g,",");
	}

	function donutPath(cx,cy,rOuter,rInner) {
		return circleToPath(cx,cy,rOuter) + " " + circleToPath(cx, cy, rInner);
	}

	// Restrict a number to a min + max range
	function restrictToRange(val, min, max) {
		if (val < min) return min;
		if (val > max) return max;
		return val;
	}

	// Round a number to the nearest 0.5
	function roundHalf(num) {
		return Math.round(num*2)/2;
	}

	// Extract decmail portion of number precision 1
	function getDecimalFixed1(value) {
		let number = (value % 1);
		return number != 0 ? parseInt(number.toFixed(1).toString().substring(number > 0 ? 2 : 3)) : 0;
	}

	function setClass(el, className, state) {
		el.classList[ state ? 'add' : 'remove' ](className);
	}

	/*
	 * The "MEAT"
	 */

	return function(targetElement, translateFn, options, properties) {
		let self = this;

		arrayOfExpostant = [ '⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹' ];

		translateFn;

		/*
		 * Options
		 */
		options = options || {};
		options = {
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
		properties = properties || {};
		properties = {
			tickDegrees: properties.tickDegrees || 300, //  Degrees of the dial that should be covered in tick lines
			rangeValue: properties.rangeValue || options.maxValue - options.minValue,
			radius: properties.radius || options.diameter/2,
			ticksOuterRadius: properties.ticksOuterRadius || options.diameter / 30,
			ticksInnerRadius: properties.ticksInnerRadius || options.diameter / 8,
			hvacStates: properties.hvacStates || ['off', 'heating', 'cooling', 'fan', 'dry' ],
			fanSpeeds: properties.fanSpeeds || [ 'images/fanIconSpeed1.gif', 'images/fanIconSpeed2.gif', 'images/fanIconSpeed3.gif', 'images/fanIconSpeed4.gif', 'images/fanIconSpeed5.gif' ],
			dragLockAxisDistance: properties.dragLockAxisDistance || 15,
		}
		properties.lblAmbientPosition = [ properties.radius, properties.ticksOuterRadius - (properties.ticksOuterRadius - properties.ticksInnerRadius) / 2 ]
		properties.offsetDegrees = 180 - (360 - properties.tickDegrees) / 2;

		/*
		 * Object state
		 */
		let state = {
			targetTemperature: options.minValue,
			ambientTemperature: options.minValue,
			hvacState: properties.hvacStates[0],
			fanSpeed: 0,
			loading: true
		};

		/*
		 * Property getter / setters
		 */
		Object.defineProperty(this, 'targetTemperature',{
			get: function() {
				return state.targetTemperature;
			},
			set: function(val) {
				state.targetTemperature = restrictToRange(+val);
				state.loading = false;
				render();
			}
		});
		Object.defineProperty(this, 'ambientTemperature',{
			get: function() {
				return state.ambientTemperature;
			},
			set: function(val) {
				state.ambientTemperature = +val;
				state.loading = false;
				render();
			}
		});
		Object.defineProperty(this, 'hvacState',{
			get: function() {
				return state.hvacState;
			},
			set: function(val) {
				if (properties.hvacStates.indexOf(val)>=0) {
					state.hvacState = val;
					state.loading = false;
					render();
				}
			}
		});
		Object.defineProperty(this, 'fanSpeed',{
			get: function() {
				return state.fanSpeed;
			},
			set: function(val) {
				val = typeof val == "string" ? parseInt(val) : val;
				if (val <= properties.fanSpeeds.length && val >= 0) {
					state.fanSpeed = val;
					state.loading = false;
					render();
				}
			}
		});
		Object.defineProperty(this, 'loading',{
			get: function() {
				return state.loading;
			},
			set: function(val) {
				state.loading = !!val;
				render();
			}
		});

		/*
		 * SVG
		 */
		let svg = createSVGElement('svg', {
			width: '100%', //options.diameter+'px',
			height: '100%', //options.diameter+'px',
			viewBox: '0 0 '+options.diameter+' '+options.diameter,
			class: 'dial'
		} ,targetElement);
		// CIRCULAR DIAL
		createSVGElement('circle', {
			cx: properties.radius,
			cy: properties.radius,
			r: properties.radius,
			class: 'dial__shape'
		}, svg);
		// EDITABLE INDICATOR
		createSVGElement('path', {
			d: donutPath(properties.radius, properties.radius, properties.radius - 4,properties.radius - 8),
			class: 'dial__editableIndicator',
		}, svg);

		/*
		 * Ticks
		 */
		let ticks = createSVGElement('g',{
			class: 'dial__ticks'
		},svg);
		let tickPoints = [
			[properties.radius - 1, properties.ticksOuterRadius],
			[properties.radius + 1, properties.ticksOuterRadius],
			[properties.radius + 1, properties.ticksInnerRadius],
			[properties.radius - 1, properties.ticksInnerRadius]
		];
		let tickPointsLarge = [
			[properties.radius - options.largeBarThickness, properties.ticksOuterRadius],
			[properties.radius + options.largeBarThickness, properties.ticksOuterRadius],
			[properties.radius + options.largeBarThickness, properties.ticksInnerRadius + 20],
			[properties.radius - options.largeBarThickness, properties.ticksInnerRadius + 20]
		];
		let theta = properties.tickDegrees/options.numTicks;
		let tickArray = [];
		for (let iTick = 0; iTick<options.numTicks; iTick++) {
			tickArray.push(createSVGElement('path', { d:pointsToPath(tickPoints) }, ticks));
		}

		/*
		 * Labels
		 */
		// lblTarget
		let lblTarget = createSVGElement('text', {
			x: properties.radius,
			y: properties.radius,
			class: 'dial__lbl dial__lbl--target'
		}, svg);
		let lblTarget_text = document.createTextNode('');
		lblTarget.appendChild(lblTarget_text);
		// lblTargetHalf
		let lblTargetHalf = createSVGElement('text', {
			x: properties.radius + properties.radius / 2.5,
			y: properties.radius - properties.radius / 8,
			class: 'dial__lbl dial__lbl--target--half'
		}, svg);
		let lblTargetHalf_text = document.createTextNode('');
		lblTargetHalf.appendChild(lblTargetHalf_text);
		// lblAmbient
		let lblAmbient = createSVGElement('text', {
			class: 'dial__lbl dial__lbl--ambient'
		}, svg);
		let lblAmbient_text = document.createTextNode('');
		lblAmbient.appendChild(lblAmbient_text);
		// lblLoading
		let lblLoading = createSVGElement('text', {
			x: properties.radius,
			y: properties.radius,
			class: 'dial__lbl dial__lbl--loading'
		}, svg);
		let lblLoading_text = document.createTextNode(translateFn('loading'));
		lblLoading.appendChild(lblLoading_text);
		// lblHvacState
		let lblHvacState = createSVGElement('text', {
			x: properties.radius,
			y: (properties.radius/8) * 5,
			class: 'dial__lbl dial__lbl--hvac-state'
		}, svg);
		let lblHvacState_text = document.createTextNode('');
		lblHvacState.appendChild(lblHvacState_text);
		// lblFanSpeedImage
		let lblFanSpeedImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
		lblFanSpeedImage.setAttributeNS(null, 'height', options.fanIconSize);
		lblFanSpeedImage.setAttributeNS(null, 'width', options.fanIconSize);
		lblFanSpeedImage.setAttributeNS(null, 'x', properties.radius - (options.fanIconSize/2));
		lblFanSpeedImage.setAttributeNS(null, 'y', properties.radius + ((properties.radius/16) * 10) - (options.fanIconSize/2));
		lblFanSpeedImage.setAttributeNS(null, 'class', 'dial__lbl dial__lbl--fan-speed-icon');
		svg.append(lblFanSpeedImage);
		// lblFanSpeedCircle
		createSVGElement('circle', {
			cx: properties.radius + options.fanIconSize/2.75,
			cy: (properties.radius + ((properties.radius/16) * 10)) - (options.fanIconSize/2) + ((options.fanIconSize/16) * 13),
			r: options.fanIconSize/4,
			class: 'dial__shape dial--state--off'
		}, svg);
		// lblFanSpeedLabel
		let lblFanSpeedLabel = createSVGElement('text', {
			x: properties.radius + options.fanIconSize/2.75,
			y: (properties.radius + ((properties.radius/16) * 10)) - (options.fanIconSize/2) + ((options.fanIconSize/16) * 13),
			"font-size": ((options.fanIconSize/32)*13) + "px",
			class: 'dial__lbl dial__lbl--fan-speed-label'
		}, svg);
		let lblFanSpeedLabel_text = document.createTextNode(state.fanSpeed);
		lblFanSpeedLabel.appendChild(lblFanSpeedLabel_text);

		/*
		 * RENDER
		 */
		function render() {
			renderLoading();
			renderHvacState();
			renderTicks();
			renderTargetTemperature();
			renderAmbientTemperature();
			renderFanSpeed();
		}
		render();

		/*
		 * RENDER - ticks
		 */
		function renderTicks() {
			let vMin, vMax;
			if (self.loading) {
				vMin = options.minValue;
				vMax = vMin;
			} else {
				vMin = Math.min(self.ambientTemperature, self.targetTemperature);
				vMax = Math.max(self.ambientTemperature, self.targetTemperature);
			}
			let min = restrictToRange(Math.round((vMin-options.minValue)/properties.rangeValue * options.numTicks),0,options.numTicks-1);
			let max = restrictToRange(Math.round((vMax-options.minValue)/properties.rangeValue * options.numTicks),0,options.numTicks-1);
			//
			tickArray.forEach(function(tick,iTick) {
				let isLarge = self.loading ? false : iTick==min || iTick==max;
				let isActive = self.loading ? false : iTick >= min && iTick <= max;
				attr(tick, {
					d: pointsToPath(rotatePoints(isLarge ? tickPointsLarge: tickPoints, iTick * theta-properties.offsetDegrees, [ properties.radius, properties.radius ])),
					class: isActive ? 'active' : ''
				});
			});
		}

		/*
		 * RENDER - ambient temperature
		 */
		function renderAmbientTemperature() {
			let value = (options.roundAmbientTemperature ? roundHalf(self.ambientTemperature) : self.ambientTemperature);
			lblAmbient_text.nodeValue = Math.floor(value);
			if (value  % 1 != 0) {
				lblAmbient_text.nodeValue += arrayOfExpostant[getDecimalFixed1(value)];
			}
			let peggedValue = restrictToRange(self.ambientTemperature, options.minValue, options.maxValue);
			let degs = properties.tickDegrees * (peggedValue-options.minValue) / properties.rangeValue - properties.offsetDegrees;
			if (peggedValue > self.targetTemperature) {
				degs += 8;
			} else {
				degs -= 8;
			}
			let pos = rotatePoint(properties.lblAmbientPosition, degs, [ properties.radius, properties.radius ]);
			attr(lblAmbient,{
				x: pos[0],
				y: pos[1]
			});
		}

		/*
		 * RENDER - target temperature
		 */
		function renderTargetTemperature() {
			let value = (options.roundTargetTemperature ? roundHalf(self.targetTemperature) : self.targetTemperature);
			lblTarget_text.nodeValue = Math.floor(value);
			setClass(lblTargetHalf, 'shown', value % 1 != 0);
			lblTargetHalf_text.nodeValue = getDecimalFixed1(value);
		}

		/*
		 * RENDER - HVAC state
		 */
		function renderHvacState() {
			Array.prototype.slice.call(svg.classList).forEach(function(c) {
				if (c.match(/^dial--state--/)) {
					svg.classList.remove(c);
				}
			});
			svg.classList.add('dial--state--' + self.hvacState);
			lblHvacState_text.nodeValue = translateFn(self.hvacState.toLowerCase()).toUpperCase();
		}

		/*
		 * RENDER - loading
		 */
		function renderLoading() {
			svg.classList[self.loading ? 'add' : 'remove']('loading');
		}

		/*
		 * RENDER - fan speed
		 */
		function renderFanSpeed() {
			lblFanSpeedLabel_text.nodeValue = self.fanSpeed;
			if (state.fanSpeed != 0 && self.hvacState.toLowerCase() != 'off') {
				lblFanSpeedImage.setAttributeNS(null ,'style', '');
				lblFanSpeedLabel.setAttribute('style', '');
				// prevent restarting the gif animation each render if gif dosen't change
				if (lblFanSpeedImage.getAttributeNS(null ,'href') != properties.fanSpeeds[state.fanSpeed-1]) {
					lblFanSpeedImage.setAttributeNS(null ,'href', properties.fanSpeeds[state.fanSpeed-1]);
				}
			} else {
				lblFanSpeedImage.setAttributeNS(null ,'style', 'opacity: 0');
				lblFanSpeedLabel.setAttribute('style', 'opacity: 0');
			}
		}

	};
})();
