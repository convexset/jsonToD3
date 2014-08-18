/* TO DO

- Refactor: JSON to Chart function
- Font size nonsense
- Documentation

*/

var jsonToD3 = {
	parseTag: function(plotTag) {
		var json = plotTag.innerHTML
		plotTag.innerHTML = ''

		var chart_info = null
		try {
			chart_info = JSON.parse(json);
			chart_info.plot_type = plotTag.tagName.toUpperCase()
		} catch (error) {
			plotTag.setAttribute('error', error)
			chart_info = null
			throw error
		}

		return chart_info
	},

	slugify: function(s) {
		return s.toString().toLowerCase().replace(/[^a-z,0-9,_]/g, '')
	},

	matchRGB: function(s) {
		var rgbRegEx1 = /^#[0-9,A-F,a-f]{6}$/
		var rgbRegEx2 = /^#[0-9,A-F,a-f]{3}$/
		
		return rgbRegEx1.test(s) || rgbRegEx2.test(s) 
	},

	roundToSFs: function(n, sf) {
	    var mult = Math.pow(10, sf - Math.floor(Math.log(n) / Math.LN10) - 1);
	    return Math.round(n * mult) / mult;
	},

	validatePointPlotSettings: function(info, plot_type, location, parent) {
		var errors = []

		////////////////////////////////////////////////////////////////
		// Markers
		////////////////////////////////////////////////////////////////

		var DEFAULT_MARKER_FILLOPACITY = 1
		if (info.marker_opacity != null) {
			info.marker_opacity = parseFloat(info.marker_opacity.toString())
			if (isNaN(info.marker_opacity)) {
				errors.push("Error parsing marker_opacity at " + location.toString() + ".")
			}
		} else {
			info.marker_opacity = (parent != null) ? parent.marker_opacity : DEFAULT_MARKER_FILLOPACITY
		}
		if ((info.marker_opacity > 1) || (info.marker_opacity < 0)) {
			errors.push("Invalid marker_opacity at " + location.toString() + ".")
		}

		var DEFAULT_MARKER_RADIUS = 3.5
		if (info.marker_radius != null) {
			try {
				info.marker_radius = parseFloat(info.marker_radius.toString())
			} catch (e) {
				errors.push("Error parsing marker_radius at " + location.toString() + ".")
			}
		} else {
			info.marker_radius = (parent != null) ? parent.marker_radius : DEFAULT_MARKER_RADIUS
		}
		if (info.marker_radius < 0) {
			errors.push("Invalid marker_radius at " + location.toString() + ".")
		}

		var DEFAULT_MARKER_BORDER = "#000"
		if (info.marker_border != null) {
			info.marker_border = info.marker_border.toString()
		} else {
			info.marker_border = (parent != null) ? parent.marker_border : DEFAULT_MARKER_BORDER
		}
		if ((info.marker_border.toLowerCase() != "none") && (!jsonToD3.matchRGB(info.marker_border))) {
			errors.push("Invalid marker_border at " + location.toString() + ".")
		}

		if (info.use_markers != null) {
			info.use_markers = true && info.use_markers
		} else {
			info.use_markers = true
		}


		////////////////////////////////////////////////////////////////
		// Markers
		////////////////////////////////////////////////////////////////

		var DEFAULT_LINE_OPACITY = 1
		if (info.line_opacity != null) {
			try {
				info.line_opacity = parseFloat(info.line_opacity.toString())
			} catch (e) {
				errors.push("Error parsing line_opacity at " + location.toString() + ".")
			}
		} else {
			info.line_opacity = (parent != null) ? parent.line_opacity : DEFAULT_LINE_OPACITY
		}
		if ((info.line_opacity > 1) || (info.line_opacity < 0)) {
			errors.push("Invalid line_opacity at " + location.toString() + ".")
		}

		var DEFAULT_LINE_WIDTH = 1.5
		if (info.line_width != null) {
			try {
				info.line_width = parseFloat(info.line_width.toString())
			} catch (e) {
				errors.push("Error parsing line_width at " + location.toString() + ".")
			}
		} else {
			info.line_width = (parent != null) ? parent.line_width : DEFAULT_LINE_WIDTH
		}
		if (info.line_width < 0) {
			errors.push("Invalid line_width at " + location.toString() + ".")
		}


		if (info.draw_line != null) {
			info.draw_line = true && info.draw_line
		} else {
			info.draw_line = true
		}

		////////////////////////////////////////////////////////////////
		// Bubble Plot
		////////////////////////////////////////////////////////////////
		if (plot_type == "BUBBLEPLOT") {
			info.use_markers = true
			info.draw_line = false

			var DEFAULT_BUBBLE_SCALE = 25
			if (info.bubble_scale != null) {
				try {
					info.bubble_scale = parseFloat(info.bubble_scale.toString())
				} catch (e) {
					errors.push("Error parsing bubble_scale at " + location.toString() + ".")
				}
			} else {
				info.bubble_scale = (parent != null) ? parent.bubble_scale : DEFAULT_BUBBLE_SCALE
			}
			if (info.bubble_scale <= 0) {
				errors.push("Invalid bubble_scale at " + location.toString() + ".")
			}
		}
		////////////////////////////////////////////////////////////////


		if (errors.length == 0) {
			return true	
		} else {
			throw errors
		}
	},

	validateChartInfo: function(chart_info) {
		var errors = []

		if (chart_info.margins == null) { errors.push("Error: margins not defined in chart definition.") }
		if (!isFinite(chart_info.margins.top)) { errors.push("Invalid margins.top in chart definition.") }
		if (!isFinite(chart_info.margins.right)) { errors.push("Invalid margins.right in chart definition.") }
		if (!isFinite(chart_info.margins.bottom)) { errors.push("Invalid margins.bottom in chart definition.") }
		if (!isFinite(chart_info.margins.left)) { errors.push("Invalid margins.left in chart definition.") }

		if (chart_info.dimensions == null) { errors.push("Error: dimensions not defined in chart definition.") }
		if ((!isFinite(chart_info.dimensions.width)) || (chart_info.dimensions.width <= 0)) { errors.push("Invalid dimensions.width in chart definition.") }
		if ((!isFinite(chart_info.dimensions.height)) || (chart_info.dimensions.height <= 0)) { errors.push("Invalid dimensions.height in chart definition.") }

		if ((chart_info.has_datetime_x_axis != null) && (chart_info.has_datetime_x_axis)) {
			chart_info.has_datetime_x_axis = true
			if (chart_info.datetime_x_axis_format != null) {
				chart_info.datetime_x_axis_format = chart_info.datetime_x_axis_format.toString()
			} else {
				chart_info.datetime_x_axis_format = "" // "%Y-%m-%d"
			}
		} else {
			chart_info.has_datetime_x_axis = false
			chart_info.datetime_x_axis_format = ""
		}

		if ((chart_info.has_datetime_y_axis != null) && (chart_info.has_datetime_y_axis)) {
			chart_info.has_datetime_y_axis = true
			if (chart_info.datetime_y_axis_format != null) {
				chart_info.datetime_y_axis_format = chart_info.datetime_y_axis_format.toString()
			} else {
				chart_info.datetime_y_axis_format = "" // "%Y-%m-%d"
			}
		} else {
			chart_info.has_datetime_y_axis = false
			chart_info.datetime_y_axis_format = ""
		}

		if (chart_info.x_label != null) {
			chart_info.x_label = chart_info.x_label.toString()
		} else {
			chart_info.x_label = ""
		}

		if (chart_info.y_label != null) {
			chart_info.y_label = chart_info.y_label.toString()
		} else {
			chart_info.y_label = ""
		}


		if (chart_info.show_legend != null) {
			chart_info.show_legend = true && chart_info.show_legend
		} else {
			chart_info.show_legend = true
		}

		if ((chart_info.tooltip_color != null) && (jsonToD3.matchRGB(chart_info.tooltip_color))) {
			chart_info.tooltip_color = chart_info.tooltip_color.toString()
		} else {
			chart_info.tooltip_color = "#000"
		}

		if (chart_info.tooltip_font != null) {
			chart_info.tooltip_font = chart_info.tooltip_font.toString()
		} else {
			chart_info.tooltip_font = "11px Sans Serif"
		}

		if (chart_info.tooltip_significant_figures != null) {
			chart_info.tooltip_significant_figures = parseInt(chart_info.tooltip_significant_figures.toString())
			if (isNaN(chart_info.tooltip_significant_figures)) {
				errors.push("Error parsing tooltip_significant_figures in chart definition.")
			}
		} else {
			chart_info.tooltip_significant_figures = -1
		}


		if (chart_info.title != null) {
			chart_info.title = chart_info.title.toString()
		} else {
			chart_info.title = ""
		}

		if (chart_info.title_font != null) {
			chart_info.title_font = chart_info.title_font.toString()
		} else {
			chart_info.title_font = "bold 14px Sans-Serif"
		}

		if (chart_info.title_underline != null) {
			chart_info.title_underline = true && chart_info.title_underline
		} else {
			chart_info.title_underline = false
		}

		if (chart_info.axes_font != null) {
			chart_info.axes_font = chart_info.axes_font.toString()
		} else {
			chart_info.axes_font = "10px Sans-Serif"
		}

		if (chart_info.axes_label_font != null) {
			chart_info.axes_label_font = chart_info.axes_label_font.toString()
		} else {
			chart_info.axes_label_font = "bold 12px Sans-Serif"
		}

		if (chart_info.legend_font != null) {
			chart_info.legend_font = chart_info.legend_font.toString()
		} else {
			chart_info.legend_font = "12px Sans-Serif"
		}

		if (!jsonToD3.validatePointPlotSettings(chart_info, chart_info.plot_type, "chart definition", null)) {
			errors.push("Settings validation failed in chart definition.")
		}

		if (errors.length == 0) {
			return true	
		} else {
			throw errors
		}
	},

	checkAndParsePointsAndLabel: function(ds, plot_type, hasDateXAxis, hasDateYAxis) {
		var errors = []
		var data = ds.data

		data_description = {}
		data_description.x_min = Infinity
		data_description.y_min = Infinity
		data_description.x_max = -Infinity
		data_description.y_max = -Infinity

		var data_dimension = 2
		if (plot_type == "SCATTERPLOT") {
			data_dimension = 2
		}
		if (plot_type == "BUBBLEPLOT") {
			data_dimension = 3
		}

		if (data_dimension == 3) {
			data_description.z_min = Infinity
			data_description.z_max = -Infinity
		}

		for (var i = 0; i < data.length; i++) {
			var point = data[i]
			if ((point.length == null) || (point.length < data_dimension)) {
				errors.push("Invalid point in series \"" + ds.series_name + "\" at index " + i + ".")
			}

			if (point.length < data_dimension + 1) {
				point.push("")
			}

			var newPoint = {}

			if (hasDateXAxis) {
				newPoint.x = new Date(Date.parse(point[0]))
				if (isNaN(newPoint.x)) {
					errors.push("Invalid point in series \"" + ds.series_name + "\" at index " + i + " (error parsing date as x-coordinate).")
				} 
			} else {
				newPoint.x = parseFloat(point[0])
				if (isNaN(newPoint.x) || (!isFinite(newPoint.x))) {
					errors.push("Invalid point in series \"" + ds.series_name + "\" at index " + i + " (error parsing x-coordinate).")
				} 
			}
			data_description.x_min = data_description.x_min < newPoint.x ? data_description.x_min : newPoint.x
			data_description.x_max = data_description.x_max > newPoint.x ? data_description.x_max : newPoint.x

			if (hasDateYAxis) {
				newPoint.y = new Date(Date.parse(point[1]))
				if (isNaN(newPoint.y)) {
					errors.push("Invalid point in series \"" + ds.series_name + "\" at index " + i + " (error parsing date as y-coordinate).")
				}
			} else {
				newPoint.y = parseFloat(point[1])
				if (isNaN(newPoint.y) || (!isFinite(newPoint.y))) {
					errors.push("Invalid point in series \"" + ds.series_name + "\" at index " + i + " (error parsing y-coordinate).")
				}
			}
			data_description.y_min = data_description.y_min < newPoint.y ? data_description.y_min : newPoint.y
			data_description.y_max = data_description.y_max > newPoint.y ? data_description.y_max : newPoint.y
			
			if (data_dimension == 3) {
				newPoint.z = parseFloat(point[2])
				if (isNaN(newPoint.z) || (!isFinite(newPoint.z))) {
					errors.push("Invalid point in series \"" + ds.series_name + "\" at index " + i + " (error parsing z-coordinate).")
				}
				data_description.z_min = data_description.z_min < newPoint.z ? data_description.z_min : newPoint.z
				data_description.z_max = data_description.z_max > newPoint.z ? data_description.z_max : newPoint.z
			}

			newPoint.marker_opacity = ds.marker_opacity
			newPoint.marker_border = ds.marker_border


			if (plot_type == "BUBBLEPLOT") {
				newPoint.marker_radius = ds.bubble_scale * newPoint.z
			}
			if (plot_type == "SCATTERPLOT") {
				if (ds.use_markers) {
					newPoint.marker_radius = ds.marker_radius	
				} else if (isFinite(ds.line_width) && isFinite(ds.line_opacity)) {
					newPoint.marker_opacity = ds.line_opacity
					newPoint.marker_radius = ds.line_width / 2.0
					newPoint.marker_border = "none"
				} else {
					newPoint.marker_opacity = 0
					newPoint.marker_radius = 0
					newPoint.marker_border = "none"
				}
			}

			newPoint.id = point[data_dimension].toString()
			newPoint.series_name = ds.series_name

			data[i] = newPoint
			
		}

		if (errors.length == 0) {
			return data_description
		} else {
			throw errors
		}
	},

	validateSeriesInfo: function(chart_info) {
		var errors = []

		if (chart_info.data_series == null) { errors.push("Error: data_series not defined in chart definition.") }
		if (chart_info.data_series.length == null) { errors.push("Invalid data_series in chart definition.") }


		var chart_data_description = {}
		chart_data_description.x_min = Infinity
		chart_data_description.y_min = Infinity
		chart_data_description.x_max = -Infinity
		chart_data_description.y_max = -Infinity

		var all_data_points = []
		var all_data_lines = []

		for (var i = 0; i < chart_info.data_series.length; i++) {
			var ds = chart_info.data_series[i]

			if (ds.series_name == null) {
				ds.series_name = "Series " + (i+1)
			} else {
				ds.series_name = ds.series_name.toString()
			}
			for (var j = 0; j < i; j++) {
				if (ds.series_name == chart_info.data_series[j].series_name) {
					errors.push("Duplicate series name (\"" + ds.series_name + "\") at indexes " + j + " and " + i + ".")
				}

				var thisSlug = jsonToD3.slugify(ds.series_name)
				var thatSlug = jsonToD3.slugify(chart_info.data_series[j].series_name)
				if (thisSlug == thatSlug) {
					errors.push("Duplicate slugged series name (\"" + ds.series_name + "\" -> \"" + thisSlug + "\"; \"" + chart_info.data_series[j].series_name + "\" -> \"" + thatSlug + "\") at indexes " + j + " and " + i + ".")
				}
			}

			if (!jsonToD3.validatePointPlotSettings(ds, chart_info.plot_type, ds.series_name, chart_info)) {
				errors.push("Settings validation failed for series \"" + ds.series_name + "\".")
			}

			if (ds.data == null) { errors.push("Error: data not defined in series \"" + ds.series_name + "\".") }
			if (ds.data.length == null) { errors.push("Invalid data in series \"" + ds.series_name + "\".") }

			var data_description = jsonToD3.checkAndParsePointsAndLabel(ds, chart_info.plot_type, chart_info.has_datetime_x_axis, chart_info.has_datetime_y_axis)
			if (data_description != null) {
				ds.data_description = data_description

				chart_data_description.x_min = chart_data_description.x_min < data_description.x_min ? chart_data_description.x_min : data_description.x_min
				chart_data_description.x_max = chart_data_description.x_max > data_description.x_max ? chart_data_description.x_max : data_description.x_max
				chart_data_description.y_min = chart_data_description.y_min < data_description.y_min ? chart_data_description.y_min : data_description.y_min
				chart_data_description.y_max = chart_data_description.y_max > data_description.y_max ? chart_data_description.y_max : data_description.y_max
			} else {
				return false
			}

			var points = ds.data
			for (var j = 0; j < points.length; j++) {
				if ((chart_info.plot_type == "BUBBLEPLOT") || (points[j].marker_radius > 0)) {
					all_data_points.push(points[j])
				}
			}
			if (ds.draw_line) {
				for (var j = 0; j < points.length; j++) {
					all_data_lines.push(points[j])
				}
			}
		}

		chart_info.all_data_points = all_data_points
		chart_info.all_data_lines = all_data_lines
		chart_info.chart_data_description = chart_data_description

		if (errors.length == 0) {
			return true	
		} else {
			throw errors
		}
	},

	makeChartCanvas: function(plotTag) {
		var chart_info = jsonToD3.parseTag(plotTag)

		if (chart_info == null) { return null }
		if (!jsonToD3.validateChartInfo(chart_info)) { return null }
		if (!jsonToD3.validateSeriesInfo(chart_info)) { return null }

		plotTag.setAttribute('plottype', chart_info.plot_type)
		// console.log(chart_info.plot_type, chart_info)

		var svg = null
		try {
			var margins = chart_info.margins
			var width = chart_info.dimensions.width
			var height = chart_info.dimensions.height
			var inner_width = width - margins.left - margins.right
			var inner_height = height - margins.top - margins.bottom

			var data_points = chart_info.all_data_points
			var data_lines = chart_info.all_data_lines

			var unique_tag = "CHARTAREA" + (++jsonToD3.plotIdx).toString()
			while (document.getElementsByTagName(unique_tag).length > 0) {
				unique_tag = "CHARTAREA" + (++jsonToD3.plotIdx).toString()
			}

			// Setup canvas 
			var svgParent = plotTag.appendChild(document.createElement(unique_tag))
			var svg = d3.select(unique_tag).append("svg")
							.style("position", "relative")
							.style("width", width)
							.style("height", height)
							.append("g")
							.attr("transform", "translate(" + margins.left + "," + margins.top + ")")

			var tooltip = d3.select(unique_tag).append("div")
								.attr("class", "tooltip")
								.style("opacity", 0)
								.style("position", "absolute")
								.style("width", "200pn")
								//.style("height", "28px")
								.style("height", "50px")
								.style("pointer-events", "none")
								.style("text-align", "left")
								.style("vertical-align", "top")
								.style("color", chart_info.tooltip_color)
								.style("font", chart_info.tooltip_font)

			var title = null
			if (chart_info.title != "") {
				/*
				title = svg.append("text")
								.attr("class", "title")
								.html(chart_info.title)
								.style("font", chart_info.title_font)
								.style("text-anchor", "middle")
								.style("text-decoration", chart_info.title_underline ? "underline" : "none")
								.attr("x", inner_width / 2) // Huh!? Why is margins.left+(inner_width/2) wrong?
								.attr("y", -8)
				//*/

				title = d3.select(unique_tag).append("div")
								.attr("class", "title")
								.style("position", "absolute")
								.style("width", inner_width)
								//.style("height", inner_height)
								.style("font", chart_info.title_font)
								.style("text-align", "center")
								.style("vertical-align", "top")
								.style("text-decoration", chart_info.title_underline ? "underline" : "none")
								.html(chart_info.title)
								.style("left", (inner_width / 2) + 'px')
								.style("top", (svg[0][0].offsetParent.offsetTop) + 'px')
			}


			// Setup x 
			var xValue = function(d) { return d.x }
			var xValueTT = function(d) {
				if (chart_info.has_datetime_x_axis && (chart_info.datetime_x_axis_format != "")) {
					return d3.time.format(chart_info.datetime_x_axis_format)(d.x)
				} else {
					if (chart_info.tooltip_significant_figures > 0) {
						return jsonToD3.roundToSFs(d.x, chart_info.tooltip_significant_figures)
						return d.x.toPrecision(chart_info.tooltip_significant_figures)
					} else {
						return d.x
					}
				}
			}
			var xScale = null
			var xAxis = null
			if (!chart_info.has_datetime_x_axis) {
				xScale = d3.scale.linear().rangeRound([0, inner_width])
				xAxis = d3.svg.axis().scale(xScale).orient("bottom")
			} else {
				xScale = d3.time.scale().rangeRound([0, inner_width])
				xAxis = d3.svg.axis().scale(xScale).orient("bottom")
				if (chart_info.datetime_x_axis_format != "") {
					xAxis.tickFormat(d3.time.format(chart_info.datetime_x_axis_format))
				}
			}
			var xMap = function(d) { return xScale(xValue(d));}


			// Setup y
			var yValue = function(d) { return d.y }
			var yValueTT = function(d) {
				if (chart_info.has_datetime_y_axis && (chart_info.datetime_y_axis_format != "")) {
					return d3.time.format(chart_info.datetime_y_axis_format)(d.y)
				} else {
					if (chart_info.tooltip_significant_figures > 0) {
						return jsonToD3.roundToSFs(d.y, chart_info.tooltip_significant_figures)
						return d.y.toPrecision(chart_info.tooltip_significant_figures)
					} else {
						return d.y
					}
				}
			}
			var yScale = null
			var yAxis = null
			if (!chart_info.has_datetime_y_axis) {
				yScale = d3.scale.linear().rangeRound([inner_height, 0])
				yAxis = d3.svg.axis().scale(yScale).orient("left")
			} else {
				yScale = d3.time.scale().rangeRound([inner_height, 0])
				yAxis = d3.svg.axis().scale(yScale).orient("left")
				if (chart_info.datetime_y_axis_format != "") {
					yAxis.tickFormat(d3.time.format(chart_info.datetime_y_axis_format))
				}
			}
			var yMap = function(d) { return yScale(yValue(d));}

			// Setup z
			var zValue = function(d) { return d.z }

			// setup fill color
			var cValue = function(d) { return d.series_name }
			var color = d3.scale.category10();

			// axes scaling
			var xBuffer = Math.max(1, chart_info.chart_data_description.x_max - chart_info.chart_data_description.x_min) * 0.025
			var yBuffer = Math.max(1, chart_info.chart_data_description.y_max - chart_info.chart_data_description.y_min) * 0.025
			//xScale.domain([chart_info.chart_data_description.x_min - xBuffer, chart_info.chart_data_description.x_max + xBuffer]);
			//yScale.domain([chart_info.chart_data_description.y_min - yBuffer, chart_info.chart_data_description.y_max + yBuffer]);
			xScale.domain([chart_info.chart_data_description.x_min, chart_info.chart_data_description.x_max]);
			yScale.domain([chart_info.chart_data_description.y_min, chart_info.chart_data_description.y_max]);


			// x-axis
			svg.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + inner_height + ")")
					.call(xAxis)
					.style("fill", "#000") // X Tick Labels
					.style("font", chart_info.axes_font)
				.append("foreignObject")
	                .attr("class","label")
	                .append("xhtml:div")
	                .attr("class","label")
					.style("position", "absolute")
					.style("text-align", "center")
					.style("vertical-align", "top")
					.style("width", inner_width)
					.style("font", chart_info.axes_label_font)
					.style("left", (margins.left) + 'px')
					.style("top", (svg[0][0].offsetTop + inner_height + margins.top + 25) + 'px')
					.html(chart_info.x_label)
				/*
				.append("text")
					.attr("class", "label")
					.attr("x", inner_width)
					.attr("y", -6)
					.style("text-anchor", "end")
					.style("font", chart_info.axes_label_font)
					.text(chart_info.x_label)
				*/

			// y-axis
			svg.append("g")
					.attr("class", "y axis")
					.call(yAxis)
					.style("fill", "#000") // Y Tick Labels
					.style("font", chart_info.axes_font)
				.append("foreignObject")
	                .attr("class","label")
	                .append("xhtml:div")               
	                .attr("class","label")
					.style("position", "absolute")
					.style("text-align", "center")
					.style("vertical-align", "top")
					.style("width", inner_width)
					.style("font", chart_info.axes_label_font)
					.style("top", (svg[0][0].offsetTop + inner_height/2) + 'px')
					.style("left", (-inner_width/2) + 'px')
					.style("transform", "rotate(-90deg)")
					.text(chart_info.y_label)
				/*
				.append("text")
					.attr("class", "label")
					.attr("transform", "rotate(-90)")
					.attr("y", 6)
					.attr("dy", ".71em")
					.style("text-anchor", "end")
					.style("font", chart_info.axes_label_font)
					.text(chart_info.y_label)
				*/

			svg.selectAll(".axis line")
					.style("stroke", "#000") // Ticks
					.style("fill", "none")
					.style("shape-rendering", "crispEdges")

			svg.selectAll(".axis path")
					.style("stroke", "#000") // Axes proper
					.style("fill", "none")
					.style("shape-rendering", "crispEdges")


			// draw lines
			var line = d3.svg.line()	
					    .x(function(d) { return xMap(d) })
					    .y(function(d) { return yMap(d) })
			var dataNest = d3.nest()
				.key(function(d) {return d.series_name})
				.entries(data_lines);
		    for (var i = 0; i < chart_info.data_series.length; i++) {
		    	var ds = chart_info.data_series[i]
		    	if (!ds.draw_line) { continue }
				svg.append("path")
					.attr("class", "line")
		            .style("stroke", function() { return color(ds.series_name) })
		            .style("stroke-width", ds.line_width )
		            .style("opacity", ds.line_opacity )
		            .style("fill", "none" )
					.attr("id", 'tag_'+ jsonToD3.slugify(ds.series_name)) // assign ID
					.attr("d", line(ds.data))
		    }

			// draw dots
			svg.selectAll(".marker")
					.data(data_points)
				.enter().append("circle")
					.attr("class", "marker")
					.attr("r", function(d) {return d.marker_radius})
					.attr("cx", xMap)
					.attr("cy", yMap)
					.attr("id", function(d) {return 'tag_'+ jsonToD3.slugify(d.series_name)}) // assign ID
					.style("opacity", function(d) {return d.marker_opacity})
					.style("stroke", function(d) {return d.marker_border})
					.style("fill", function(d) {return color(cValue(d))}) 


			// draw bigger invisible dots for mouseover
			svg.selectAll(".invisi_marker")
					.data(data_points)
				.enter().append("circle")
					.attr("class", "invisi_marker")
					.attr("r", function(d) {return d.marker_radius + 3})
					.attr("cx", xMap)
					.attr("cy", yMap)
					.attr("id", function(d) {return 'tag_'+ jsonToD3.slugify(d.series_name)}) // assign ID
					.style("opacity", 0)
					.style("stroke", function(d) {return d.marker_border})
					.style("fill", function(d) {return color(cValue(d))}) 
					.on("mouseover", function(d) {
										var key = svgParent.tagName + "|" + jsonToD3.slugify(cValue(d))
										var isActive = jsonToD3.activeSeriesInCharts[key] ? true : false
										if (!isActive) { return }

										var tooltip_text = ""
										if (d.id == "") {
											tooltip_text = "(" + xValueTT(d) + ", " + yValueTT(d) + ")" + "<br/>(" + cValue(d) + ")"
										} else {
											tooltip_text = "<b>" + d.id + "</b><br/>(" + xValueTT(d) + ", " + yValueTT(d) + ")" + "<br/>(" + cValue(d) + ")"
										}

										tooltip.html(tooltip_text)
			           						.style("left", (d3.event.pageX + 5 + d.marker_radius) + "px")
			           						.style("top", (d3.event.pageY - 28 - d.marker_radius/2) + "px")

			           					// If we're fairly sure that MathJax exists
			           					if (MathJax != null) {
			           						if (MathJax.Hub != null) {
			           							if (MathJax.Hub.Queue != null) {
					           						var getType = {}
					           						if (getType.toString.call(MathJax.Hub.Queue) === '[object Function]') {
					           							MathJax.Hub.Queue(["Typeset",MathJax.Hub])
					           						}
					           					}
			           						}
			           					}

										tooltip.transition()
											.duration(200)
											.style("opacity", .9)
			  						})
					.on("mousemove", function(d) {
										var key = svgParent.tagName + "|" + jsonToD3.slugify(cValue(d))
										var isActive = jsonToD3.activeSeriesInCharts[key] ? true : false
										if (!isActive) { return }

										tooltip
			           						.style("left", (d3.event.pageX + 5 + d.marker_radius) + "px")
			           						.style("top", (d3.event.pageY - 28 - d.marker_radius/2) + "px")
			           				})
					.on("mouseout", function(d) {
										var key = svgParent.tagName + "|" + jsonToD3.slugify(cValue(d))
										var isActive = jsonToD3.activeSeriesInCharts[key] ? true : false
										if (!isActive) { return }

										tooltip.transition()
											.duration(500)
											.style("opacity", 0);
									})
			
			d3.selectAll("circle.invisi_marker")[0].forEach(function(elem){
				elem.parentNode.appendChild(elem);
			})


			if (chart_info.show_legend) {
				var legend_shift_x = 0
				var legend_shift_y = 0

				var fadeSeriesOnClick = function(d) {
					// Fade series in/out on click
					var key = svgParent.tagName + "|" + jsonToD3.slugify(d)
					var active = jsonToD3.activeSeriesInCharts[key] ? false : true
					var newOpacity = active ? 1 : 0;  // Hard to recover original opacities
					d3.selectAll("#tag_"+jsonToD3.slugify(d))
						.transition().duration(300) 
						.style("opacity", newOpacity);
					jsonToD3.activeSeriesInCharts[key] = active;
				}

				// draw legend
				var legend = svg.selectAll(".legend")
					.data(color.domain())
					.enter().append("g")
					.attr("class", "legend")
					.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; })

				// draw legend colored rectangles
				legend.append("rect")
					.attr("x", inner_width - 18 + legend_shift_x)
					.attr("y", 0 + legend_shift_y)
					.attr("width", 18)
					.attr("height", 18)
					.style("fill", color)
					//.on("click", fadeSeriesOnClick) // Hard to deal with recovering original opacities

				// draw legend text
				/*
				legend.append("text")
					.attr("x", inner_width - 24 + legend_shift_x)
					.attr("y", 9 + legend_shift_y)
					.attr("dy", ".35em")
					.style("text-anchor", "end")
					.text(function(d) { return d;})
					.style("font", chart_info.legend_font)
				//*/
				//*
				legend.append("foreignObject")
	                .attr("class","label")
	                .append("xhtml:div") 
					.attr("class", "legend")
					.style("position", "absolute")
					.style("text-align", "right")
					.style("vertical-align", "middle")
					.style("width", inner_width)
					.style("font", chart_info.axes_label_font)
					.style("left", (margins.left - 24) + 'px')
					.style("top", function(d, i) { return (svg[0][0].offsetTop + margins.top + 2 + i * 20) + 'px' })
					.attr("dy", ".35em")
					//.style("text-anchor", "end")
					.style("font", chart_info.legend_font)					
					.text(function(d) { return d;}) //*/
					//.on("click", fadeSeriesOnClick) // Hard to deal with recovering original opacities
			}

		} catch(error) {
			plotTag.setAttribute('error', "Unable to generate chart canvas.")
			return null
		}

		return {"svg": svg, "svgParent": svgParent, "chart_info": chart_info, "tooltip": tooltip, "title": title}
	},

	work: function() {
		var chartArray = []
		if (jsonToD3.plotIdx == null) {
			jsonToD3.plotIdx = 0
		}
		if (jsonToD3.activeSeriesInCharts == null) {
			jsonToD3.activeSeriesInCharts = []
		}

		var plot_types = ["SCATTERPLOT", "BUBBLEPLOT"]
		var plots = []

		plot_types.forEach(function(pt) {
			var elems = document.getElementsByTagName(pt)
			for (var i = 0; i < elems.length; i++) {
				plots.push(elems[i])
			}
		})

		for (var i = 0; i < plots.length; i++) {
			var plotTag = plots[i]
			var chartCanvas = jsonToD3.makeChartCanvas(plotTag)
			if (chartCanvas == null) {
				plotTag.setAttribute('rendered', false)
				continue
			} else {
				chartArray.push(chartCanvas)
				for (var j = 0; j < chartCanvas.chart_info.data_series.length; j++) {
					var ds = chartCanvas.chart_info.data_series[j]
					var key = chartCanvas.svgParent.tagName + "|" + jsonToD3.slugify(ds.series_name)
					jsonToD3.activeSeriesInCharts[key] = true
				}
			}

			plotTag.setAttribute('rendered', true)
		}

		return chartArray;
	}
}