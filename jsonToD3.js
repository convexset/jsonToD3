/*
TO DO:
- legend background and div sizes after MathJax (for the onClick)
- tickValues
*/

var jsonToD3 = {
	valid_plot_tags: ["SCATTERPLOT", "BUBBLEPLOT"],

	parseTextAsRawJSON: function(s) {
		var chart_info = null
		try {
			chart_info = JSON.parse(s)
		} catch (error) {
			// Rethrow...
			console.log("Parsing raw JSON failed.")
			chart_info = null
			throw error
		}
		return chart_info
	},

	parseTagGetRawJSON: function(plotTag) {
		var external_data_source = plotTag.getAttribute("src")

		var json = null
		if (external_data_source == null) {			
			json = plotTag.innerHTML
		} else {
			var getType = {}
			if ((!("jQuery" in window)) || (!(jQuery.ajax != null)) || (!(getType.toString.call(jQuery.ajax) === '[object Function]'))) {
				throw "Need jQuery.ajax in order to load code by SRC=\"...\""
			}
			jQuery.ajax({
						url: "examples/hdbRental_Aug2014.json",
						success: function(data){ json = data },
						async: false,
						dataType: "text"
			})
		}
		plotTag.innerHTML = ''

		var chart_info = jsonToD3.parseTextAsRawJSON(json)
		if (chart_info != null) {
			chart_info.plot_type = plotTag.tagName.toUpperCase()
		}
		
		return chart_info
	},

	slugify: function(s) {
		return s.toString().toLowerCase().replace(/[^a-z,0-9]/g, '')
	},

	get_series_key: function(unique_tag, s) {
		return unique_tag + "|" + jsonToD3.slugify(s)
	},

	get_node_tag: function(unique_tag, s) {
		return 'tag_' + unique_tag + '_node_' + jsonToD3.slugify(s)
	},

	get_path_tag: function(unique_tag, s) {
		return 'tag_' + unique_tag + '_path_' + jsonToD3.slugify(s)
	},

	get_legend_rect_tag: function(unique_tag, s) {
		return 'tag_' + unique_tag + '_legend_rect_' + jsonToD3.slugify(s)
	},

	get_legend_div_tag: function(unique_tag, s) {
		return 'tag_' + unique_tag + '_legend_div_' + jsonToD3.slugify(s)
	},

	map: function(fn, arr) {
		var mapped_arr = []
		for (var i = 0; i < arr.length; i++) {
			mapped_arr.push(fn(arr[i]))
		}
		return mapped_arr
	},

	reduce: function(fn, arr, z_start) {
		var z = z_start
		for (var i = 0; i < arr.length; i++) {
			z = fn(z, arr[i])
		}
		return z
	},

	canMathJaxTypeSet: function() {
		if ("MathJax" in window) {
			if (MathJax.Hub != null) {
				if (MathJax.Hub.Queue != null) {
					var getType = {}
					if (getType.toString.call(MathJax.Hub.Typeset) === '[object Function]') {
						return true
					}
				}
			}
		}
		return false
	},

	doMathJaxTypeSetIfPossible: function(elem) {
		if (jsonToD3.canMathJaxTypeSet()) {
			MathJax.Hub.Typeset(elem)
		}
	},

	matchRGB: function(s) {
		var rgbRegEx1 = /^#[0-9,A-F,a-f]{6}$/
		var rgbRegEx2 = /^#[0-9,A-F,a-f]{3}$/
		
		return rgbRegEx1.test(s) || rgbRegEx2.test(s) 
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
		// Lines
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
			info.draw_line = (parent != null) ? parent.draw_line : true
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

		if (chart_info.axes == null) {
			chart_info.axes = {}
		}
		if ((chart_info.axes.has_datetime_x_axis != null) && (chart_info.axes.has_datetime_x_axis)) {
			chart_info.axes.has_datetime_x_axis = true
		} else {
			chart_info.axes.has_datetime_x_axis = false
			chart_info.axes.x_axis_format = ""
		}
		if ((chart_info.axes.has_datetime_y_axis != null) && (chart_info.axes.has_datetime_y_axis)) {
			chart_info.axes.has_datetime_y_axis = true
		} else {
			chart_info.axes.has_datetime_y_axis = false
		}

		if (chart_info.axes.x_axis_format != null) {
			chart_info.axes.x_axis_format = chart_info.axes.x_axis_format.toString()
		} else {
			chart_info.axes.x_axis_format = ""
		}
		if (chart_info.axes.y_axis_format != null) {
			chart_info.axes.y_axis_format = chart_info.axes.y_axis_format.toString()
		} else {
			chart_info.axes.y_axis_format = ""
		}

		if (chart_info.axes.x_label != null) {
			chart_info.axes.x_label = chart_info.axes.x_label.toString()
		} else {
			chart_info.axes.x_label = ""
		}
		if (chart_info.axes.y_label != null) {
			chart_info.axes.y_label = chart_info.axes.y_label.toString()
		} else {
			chart_info.axes.y_label = ""
		}

		if (chart_info.axes.x_min != null) {
			chart_info.axes.x_min = chart_info.axes.x_min.toString()
			if (chart_info.axes.has_datetime_x_axis) {
				chart_info.axes.x_min = new Date(Date.parse(chart_info.axes.x_min))
			} else {
				chart_info.axes.x_min = parseFloat(chart_info.axes.x_min)
			}
			if (isNaN(chart_info.axes.x_min)) {
				errors.push("Error parsing axes.x_min")
				chart_info.axes.x_min = null
			} 			
		} else {
			chart_info.axes.x_min = null
		}
		if (chart_info.axes.x_max != null) {
			chart_info.axes.x_max = chart_info.axes.x_max.toString()
			if (chart_info.axes.has_datetime_x_axis) {
				chart_info.axes.x_max = new Date(Date.parse(chart_info.axes.x_max))
			} else {
				chart_info.axes.x_max = parseFloat(chart_info.axes.x_max)
			}
			if (isNaN(chart_info.axes.x_max)) {
				errors.push("Error parsing axes.x_max")
				chart_info.axes.x_max = null
			} 			
		} else {
			chart_info.axes.x_max = null
		}

		if (chart_info.axes.y_min != null) {
			chart_info.axes.y_min = chart_info.axes.y_min.toString()
			if (chart_info.axes.has_datetime_y_axis) {
				chart_info.axes.y_min = new Date(Date.parse(chart_info.axes.y_min))
			} else {
				chart_info.axes.y_min = parseFloat(chart_info.axes.y_min)
			}
			if (isNaN(chart_info.axes.y_min)) {
				errors.push("Error parsing axes.y_min")
				chart_info.axes.y_min = null
			} 			
		} else {
			chart_info.axes.y_min = null
		}
		if (chart_info.axes.y_max != null) {
			chart_info.axes.y_max = chart_info.axes.y_max.toString()
			if (chart_info.axes.has_datetime_y_axis) {
				chart_info.axes.y_max = new Date(Date.parse(chart_info.axes.y_max))
			} else {
				chart_info.axes.y_max = parseFloat(chart_info.axes.y_max)
			}
			if (isNaN(chart_info.axes.y_max)) {
				errors.push("Error parsing axes.y_max")
				chart_info.axes.y_max = null
			} 			
		} else {
			chart_info.axes.y_max = null
		}

		if (chart_info.axes.x_ticks != null) {
			chart_info.axes.x_ticks = parseInt(chart_info.axes.x_ticks)
			if (isNaN(chart_info.axes.x_ticks)) {
				errors.push("Error parsing axes.x_ticks")
				chart_info.axes.x_ticks = null
			} 			
		} else {
			chart_info.axes.x_ticks = null
		}
		if (chart_info.axes.x_ticks < 2) {
			chart_info.axes.x_ticks = null
		}

		if (chart_info.axes.y_ticks != null) {
			chart_info.axes.y_ticks = parseInt(chart_info.axes.y_ticks)
			if (isNaN(chart_info.axes.y_ticks)) {
				errors.push("Error parsing axes.y_ticks")
				chart_info.axes.y_ticks = null
			} 			
		} else {
			chart_info.axes.y_ticks = null
		}
		if (chart_info.axes.y_ticks < 2) {
			chart_info.axes.y_ticks = null
		}

		if (chart_info.legend_offset_x != null) {
			chart_info.legend_offset_x = parseFloat(chart_info.legend_offset_x)
			if (isNaN(chart_info.legend_offset_x)) {
				errors.push("Error parsing legend_offset_x")
				chart_info.legend_offset_x = 0
			} 			
		} else {
			chart_info.legend_offset_x = 0
		}

		if (chart_info.legend_offset_y != null) {
			chart_info.legend_offset_y = -parseFloat(chart_info.legend_offset_y)
			if (isNaN(chart_info.legend_offset_y)) {
				errors.push("Error parsing legend_offset_y")
				chart_info.legend_offset_y = 0
			} 			
		} else {
			chart_info.legend_offset_y = 0
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

			var data_description = jsonToD3.checkAndParsePointsAndLabel(ds, chart_info.plot_type, chart_info.axes.has_datetime_x_axis, chart_info.axes.has_datetime_y_axis)
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

	makeChartCanvas: function(plotTag, chart_info) {
		if (chart_info == null) { throw "Expected: JSON object in chart_info (got: null)" }
		if ((!jsonToD3.validateChartInfo(chart_info)) || (!jsonToD3.validateSeriesInfo(chart_info))) {
			var msg = "Failed to validate data series."
			console.log(msg)
			console.log("plotTag", plotTag)
			console.log("chart_info", chart_info)
			throw msg 
		}

		plotTag.setAttribute('plottype', chart_info.plot_type)
		// console.log(chart_info.plot_type, chart_info)

		var updateFunctions = {}
		var svg = null
		try {
			var margins = chart_info.margins
			var width = chart_info.dimensions.width
			var height = chart_info.dimensions.height
			var inner_width = width - margins.left - margins.right
			var inner_height = height - margins.top - margins.bottom

			var data_points = chart_info.all_data_points
			var data_lines = chart_info.all_data_lines

			var unique_tag = "JSON_TO_DTHREE_CHARTAREA" + (++jsonToD3.plotIdx).toString()
			while (document.getElementsByTagName(unique_tag).length > 0) {
				unique_tag = "JSON_TO_DTHREE_CHARTAREA" + (++jsonToD3.plotIdx).toString()
			}

			// Setup canvas 
			var svgParent = plotTag.appendChild(document.createElement(unique_tag))
			var svg = d3.select(unique_tag).append("svg")
							.style("position", "relative")
							.style("width", width)
							.style("height", height)
							.append("g")
							.attr("transform", "translate(" + margins.left + "," + margins.top + ")")


			// font size things...
			var body = document.getElementsByTagName("BODY")[0]
			var sneakyDiv = document.createElement("DIV")
			sneakyDiv.setAttribute("id", "SneakyDiv")
			body.appendChild(sneakyDiv)
			var textHeight = 0
			var textWidth = 0
			var padding = 0

			sneakyDiv.setAttribute("style", "position: absolute; visibility: hidden; height: auto; width: auto; font: " + chart_info.tooltip_font + ";")
			sneakyDiv.innerHTML = "abcdefghijklmnopqrstuvwxyz" + "abcdefghijklmnopqrstuvwxyz".toUpperCase()
			textHeight = sneakyDiv.clientHeight
			textWidth = sneakyDiv.clientWidth

			var tooltip = d3.select(unique_tag).append("div")
								.attr("class", "tooltip")
								.style("opacity", 0)
								.style("position", "absolute")
								//.style("width", "200px")
								//.style("height", "28px")
								.style("width", Math.max(100, textWidth))
								.style("height", Math.max(30, 4 + 5*textHeight))
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

				title = svg.append("foreignObject")
				                .append("xhtml:div")
								.attr("class", "title")
								.style("position", "absolute")
								.style("width", inner_width)
								//.style("height", inner_height)
								.style("font", chart_info.title_font)
								.style("text-align", "center")
								.style("vertical-align", "top")
								.style("text-decoration", chart_info.title_underline ? "underline" : "none")
								.html(chart_info.title)
								.style("left", svg[0][0].offsetLeft + margins.left)
								.style("top", 0)
			}


			// Setup x 
			var xValue = function(d) { return d.x }
			var xValueTT = function(d) {
				if (chart_info.axes.has_datetime_x_axis && (chart_info.axes.x_axis_format != "")) {
					return d3.time.format(chart_info.axes.x_axis_format)(d.x)
				} else {
					if (chart_info.axes.x_axis_format != "") {
						return d3.format(chart_info.axes.x_axis_format)(d.x)
					} else {
						return d.x
					}
				}
			}
			var xScale = null
			var xAxis = null
			if (!chart_info.axes.has_datetime_x_axis) {
				xScale = d3.scale.linear().rangeRound([0, inner_width])
				xAxis = d3.svg.axis().scale(xScale).orient("bottom")
				if (chart_info.axes.x_axis_format != "") {
					xAxis.tickFormat(d3.format(chart_info.axes.x_axis_format))
				}
			} else {
				xScale = d3.time.scale().rangeRound([0, inner_width])
				xAxis = d3.svg.axis().scale(xScale).orient("bottom")
				if (chart_info.axes.x_axis_format != "") {
					xAxis.tickFormat(d3.time.format(chart_info.axes.x_axis_format))
				}
			}
			if (chart_info.axes.x_ticks != null) {
				xAxis.ticks(chart_info.axes.x_ticks)
			}
			var xMap = function(d) { return xScale(xValue(d));}


			// Setup y
			var yValue = function(d) { return d.y }
			var yValueTT = function(d) {
				if (chart_info.axes.has_datetime_y_axis && (chart_info.axes.y_axis_format != "")) {
					return d3.time.format(chart_info.axes.y_axis_format)(d.y)
				} else {
					if (chart_info.axes.y_axis_format != "") {
						return d3.format(chart_info.axes.y_axis_format)(d.y)
					} else {
						return d.y
					}
				}
			}
			var yScale = null
			var yAxis = null
			if (!chart_info.axes.has_datetime_y_axis) {
				yScale = d3.scale.linear().rangeRound([inner_height, 0])
				yAxis = d3.svg.axis().scale(yScale).orient("left")
				if (chart_info.axes.y_axis_format != "") {
					yAxis.tickFormat(d3.format(chart_info.axes.y_axis_format))
				}
			} else {
				yScale = d3.time.scale().rangeRound([inner_height, 0])
				yAxis = d3.svg.axis().scale(yScale).orient("left")
				if (chart_info.axes.y_axis_format != "") {
					yAxis.tickFormat(d3.time.format(chart_info.axes.y_axis_format))
				}
			}
			if (chart_info.axes.y_ticks != null) {
				yAxis.ticks(chart_info.axes.y_ticks)
			}
			var yMap = function(d) { return yScale(yValue(d));}

			// Setup z
			var zValue = function(d) { return d.z }

			// setup fill color
			var cValue = function(d) { return d.series_name }
			var color = d3.scale.category10();

			// axes scaling
			var x_domain = [chart_info.chart_data_description.x_min, chart_info.chart_data_description.x_max]
			var y_domain = [chart_info.chart_data_description.y_min, chart_info.chart_data_description.y_max]
			if (chart_info.axes.x_min != null) { x_domain[0] = chart_info.axes.x_min }
			if (chart_info.axes.x_max != null) { x_domain[1] = chart_info.axes.x_max }
			if (chart_info.axes.y_min != null) { y_domain[0] = chart_info.axes.y_min }
			if (chart_info.axes.y_max != null) { y_domain[1] = chart_info.axes.y_max }
			xScale.domain(x_domain)
			yScale.domain(y_domain)


			sneakyDiv.setAttribute("style", "position: absolute; visibility: hidden; height: auto; width: auto; font: " + chart_info.axes_label_font + ";")
			sneakyDiv.innerHTML = "abcdefghijklmnopqrstuvwxyz" + "abcdefghijklmnopqrstuvwxyz".toUpperCase()
			textHeight = sneakyDiv.clientHeight
			textWidth = sneakyDiv.clientWidth

			// x-axis
			var x_axis = svg.append("g")
							.attr("class", "x axis")
							.attr("transform", "translate(0," + inner_height + ")")
							.call(xAxis)
							.style("fill", "#000") // X Tick Labels
							.style("font", chart_info.axes_font)

			var getXAxisHeight = function (node) {
				try {
					return Math.abs(node.childNodes[0].y2.baseVal.value - node.childNodes[0].y1.baseVal.value) + 1 + node.childNodes[1].clientHeight
				} catch (e) {
					return -1
				}
			}
			padding = jsonToD3.reduce(Math.max, jsonToD3.map(getXAxisHeight, x_axis[0][0].childNodes), -Infinity)

			x_axis.append("foreignObject")
	                .attr("class","label")
	                .append("xhtml:div")
	                .attr("class","label")
					.style("position", "absolute")
					.style("text-align", "center")
					.style("vertical-align", "top")
					.style("width", inner_width)
					.style("font", chart_info.axes_label_font)
					.style("left", svg[0][0].offsetLeft + margins.left)
					.style("top", svg[0][0].offsetTop + margins.top + inner_height + padding)
					.html(chart_info.axes.x_label)
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
			var y_axis = svg.append("g")
						.attr("class", "y axis")
						.call(yAxis)
						.style("fill", "#000") // Y Tick Labels
						.style("font", chart_info.axes_font)

			var getYAxisWidth = function (node) {
				try {
					return Math.abs(node.childNodes[0].x2.baseVal.value - node.childNodes[0].x1.baseVal.value) + 1 + node.childNodes[1].clientWidth
				} catch (e) {
					return -1
				}
			}
			padding = jsonToD3.reduce(Math.max, jsonToD3.map(getYAxisWidth, y_axis[0][0].childNodes), -Infinity)
			sneakyDiv.setAttribute("style", "position: absolute; visibility: hidden; height: auto; width: auto; font: " + chart_info.axes_label_font + ";")
			sneakyDiv.innerHTML = chart_info.axes.y_label
			textHeight = sneakyDiv.clientHeight
			textWidth = sneakyDiv.clientWidth

			y_axis.append("foreignObject")
	                .attr("class","label")
	                .append("xhtml:div")               
	                .attr("class","label")
					.style("position", "absolute")
					.style("text-align", "center")
					.style("vertical-align", "top")
					.style("width", inner_height)
					.style("height", "auto")
					.style("font", chart_info.axes_label_font)
					.style("top", svg[0][0].offsetTop + margins.top + inner_height)
					.style("left", svg[0][0].offsetLeft + margins.left - padding - textHeight - 4)
					.style("transform", "rotate(-90deg)")
					.style("transform-origin", "0% 0%")
					.text(chart_info.axes.y_label)
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
					.attr("id", function(d) {return jsonToD3.get_path_tag(unique_tag, ds.series_name)}) // assign ID
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
					.attr("id", function(d) {return jsonToD3.get_node_tag(unique_tag, d.series_name)}) // assign ID
					.style("opacity", function(d) {return d.marker_opacity})
					.style("stroke", function(d) {return d.marker_border})
					.style("fill", function(d) {return color(cValue(d))}) 
					.style("cursor", "crosshair")
					.on("mouseover", function(d) {
										var key = jsonToD3.get_series_key(unique_tag, cValue(d))
										var isActive = jsonToD3.activeSeriesInCharts[key]['active']
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

			           					jsonToD3.doMathJaxTypeSetIfPossible(tooltip)

										tooltip.transition()
											.duration(200)
											.style("opacity", .9)
			  						})
					.on("mousemove", function(d) {
										var key = jsonToD3.get_series_key(unique_tag, cValue(d))
										var isActive = jsonToD3.activeSeriesInCharts[key]['active']
										if (!isActive) { return }

										tooltip
			           						.style("left", (d3.event.pageX + 5 + d.marker_radius) + "px")
			           						.style("top", (d3.event.pageY - 28 - d.marker_radius/2) + "px")
			           				})
					.on("mouseout", function(d) {
										var key = jsonToD3.get_series_key(unique_tag, cValue(d))
										var isActive = jsonToD3.activeSeriesInCharts[key]['active']
										if (!isActive) { return }

										tooltip.transition()
											.duration(500)
											.style("opacity", 0);
									})
			
			for (var i = 0; i < chart_info.data_series.length; i++) {
				var ds = chart_info.data_series[i]
				var key = jsonToD3.get_series_key(unique_tag, ds.series_name)
				jsonToD3.activeSeriesInCharts[key] = {}
				jsonToD3.activeSeriesInCharts[key]['active'] = true
				jsonToD3.activeSeriesInCharts[key]['org_opacity'] = {}
				jsonToD3.activeSeriesInCharts[key]['org_opacity'][jsonToD3.get_node_tag(unique_tag, ds.series_name)] = ds.marker_opacity
				jsonToD3.activeSeriesInCharts[key]['org_opacity'][jsonToD3.get_path_tag(unique_tag, ds.series_name)] = ds.line_opacity
			}

			if (chart_info.show_legend) {
				var legend_shift_x = chart_info.legend_offset_x
				var legend_shift_y = chart_info.legend_offset_y

				updateFunctions["legend"] = function() {}

				var fadeSeriesOnClick = function(d) {
					// Fade series in/out on click
					var key = jsonToD3.get_series_key(unique_tag, d)
					var active = jsonToD3.activeSeriesInCharts[key]['active'] ? false : true
					var newNodeOpacity = !active ? 0 : jsonToD3.activeSeriesInCharts[key]['org_opacity'][jsonToD3.get_node_tag(unique_tag, d)]
					var newPathOpacity = !active ? 0 : jsonToD3.activeSeriesInCharts[key]['org_opacity'][jsonToD3.get_path_tag(unique_tag, d)]
					var newLegendOpacity = !active ? 0.35 : 1
					d3.selectAll("#"+jsonToD3.get_node_tag(unique_tag, d))
						.transition().duration(300) 
						.style("opacity", newNodeOpacity)
						.style("visibility", newNodeOpacity == 0 ? "hidden" : "");
					d3.selectAll("#"+jsonToD3.get_path_tag(unique_tag, d))
						.transition().duration(300) 
						.style("opacity", newPathOpacity);
					d3.selectAll("#"+jsonToD3.get_legend_rect_tag(unique_tag, d))
						.transition().duration(300)
						.style("opacity", newLegendOpacity);
					d3.selectAll("#"+jsonToD3.get_legend_div_tag(unique_tag, d))
						.transition().duration(300)
						.style("opacity", newLegendOpacity);
					jsonToD3.activeSeriesInCharts[key]['active'] = active;

					tooltip.transition()
						.duration(300)
						.style("opacity", 0);
				}

				sneakyDiv.setAttribute("style", "position: absolute; visibility: hidden; height: auto; width: auto; font: " + chart_info.legend_font + ";")
				sneakyDiv.innerHTML = "abcdefghijklmnopqrstuvwxyz" + "abcdefghijklmnopqrstuvwxyz".toUpperCase()

				textHeight = sneakyDiv.clientHeight
				var legendDeltaGap = 3
				var legendSquareSide = textHeight + 4 // 18
				var legendSquareSidePlus = legendSquareSide + legendDeltaGap
				
				var legendWidth = -Infinity
				var legendBorderShift = 1 + Math.floor(legendSquareSide / 3.0)


				// draw legend background first
				var legend_bg = svg.append("rect")

				// draw legend
				var legend = svg.selectAll(".legend")
					.data(color.domain())
					.enter().append("g")
					.attr("class", "legend")
					.attr("transform", function(d, i) { return "translate(0," + (i * legendSquareSidePlus) + ")"; })

				// draw legend colored rectangles
				legend.append("rect")
					.attr("x", inner_width + margins.right - legendSquareSide + legend_shift_x - legendBorderShift)
					.attr("y", 0 + legend_shift_y + legendBorderShift)
					.attr("width", legendSquareSide)
					.attr("height", legendSquareSide)
					.style("fill", color)
					.style("cursor", "pointer")
					.attr("id", function(d) {return jsonToD3.get_legend_rect_tag(unique_tag, d)}) // assign ID
					.on("click", fadeSeriesOnClick)
					.on("mouseover", function(d) {
										var key = jsonToD3.get_series_key(unique_tag, d)
										var isActive = jsonToD3.activeSeriesInCharts[key]['active']

										tooltip.html("<b>" + d + "</b><br/>" + (isActive ? "(Click to hide)" : "(Click to show)"))
			           						.style("left", (d3.event.pageX + 1 + legendSquareSide/2) + "px")
			           						.style("top", (d3.event.pageY - 1 - legendSquareSide/2) + "px")

			           					jsonToD3.doMathJaxTypeSetIfPossible(tooltip)

										tooltip.transition()
											.duration(200)
											.style("opacity", .9)
			  						})
					.on("mousemove", function(d) {
										// No need to update text... Tooltip will be hidden on toggle
										tooltip
			           						.style("left", (d3.event.pageX + 1 + legendSquareSide/2) + "px")
			           						.style("top", (d3.event.pageY - 1 - legendSquareSide/2) + "px")
			           				})
					.on("mouseout", function(d) {
										tooltip.transition()
											.duration(500)
											.style("opacity", 0)
									})

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
				var legend_labels = legend.append("foreignObject")
						                .attr("class","label")
						                .append("xhtml:div") 
										.attr("class", "legend")
										.style("position", "absolute")
										.style("text-align", "right")
										.style("vertical-align", "middle")
										.style("cursor", "pointer")
										.on("click", fadeSeriesOnClick)
										.on("mouseover", function(d) {
															var key = jsonToD3.get_series_key(unique_tag, d)
															var isActive = jsonToD3.activeSeriesInCharts[key]['active']

															tooltip.html("<b>" + d + "</b><br/>" + (isActive ? "(Click to hide)" : "(Click to show)"))
								           						.style("left", (d3.event.pageX + 1 + legendSquareSide/2) + "px")
								           						.style("top", (d3.event.pageY - 1 - legendSquareSide/2) + "px")

								           					jsonToD3.doMathJaxTypeSetIfPossible(tooltip)

															tooltip.transition()
																.duration(200)
																.style("opacity", .9)
								  						})
										.on("mousemove", function(d) {
															// No need to update text... Tooltip will be hidden on toggle
															tooltip
								           						.style("left", (d3.event.pageX + 1 + legendSquareSide/2) + "px")
								           						.style("top", (d3.event.pageY - 1 - legendSquareSide/2) + "px")
								           				})
										.on("mouseout", function(d) {
															tooltip.transition()
																.duration(500)
																.style("opacity", 0)
														})
				
				updateFunctions["legend"] = function() {
					legendWidth = -Infinity

					var divHTML = {}
					var divWidth = {}

					legend_labels
						//.style("width", inner_width)
						.style("width", function(d) { 
							sneakyDiv.innerHTML=d
							jsonToD3.doMathJaxTypeSetIfPossible(sneakyDiv)

							divHTML[d] = sneakyDiv.innerHTML
							divWidth[d] = sneakyDiv.clientWidth

							return divWidth[d]
						})

					legend_labels
						//.style("left", (margins.left + margins.right - 24) + 'px')
						.style("left", function(d) { 
							// make sure divWidth is already populated
							legendWidth = legendWidth > divWidth[d] + 6 + legendSquareSide ? legendWidth : divWidth[d] + 6 + legendSquareSide
							return (svg[0][0].offsetLeft + legend_shift_x + inner_width - divWidth[d] + margins.left + margins.right - legendSquareSide - 6 - legendBorderShift) 
						})
						//.style("top", function(d, i) { return (svg[0][0].offsetTop + margins.top + 2 + i * 20) + 'px' })
						.style("top", function(d, i) {
							return (legend_shift_y + svg[0][0].offsetTop + margins.top + 2 + i * legendSquareSidePlus + legendBorderShift) 
						})
						.style("font", chart_info.legend_font)
						.attr("id", function(d) {return jsonToD3.get_legend_div_tag(unique_tag, d)}) // assign ID
						.html(function(d) { 
							// make sure divHTML is already populated
							return divHTML[d]
						})

					legend_bg.attr("x", function() {return inner_width + margins.right + legend_shift_x - legendWidth - 2*legendBorderShift + 1})
							.attr("y", 0 + legend_shift_y + 1)
							.attr("width", function() {return legendWidth + 2*legendBorderShift - 2})
							.attr("height", function() {return (legendSquareSidePlus * chart_info.data_series.length - legendDeltaGap) + 2*legendBorderShift - 2})
							.style("stroke", "#000")
							.style("stroke-width", 3)
							.style("fill", "#666")
							.style("opacity", 0.15)
				}

			}
			// body.removeChild(sneakyDiv) // Keep this little guy for later use

		} catch(error) {
			plotTag.setAttribute('error', "Unable to generate chart canvas.")
			return null
		}

		return {"svg": svg, "svgParent": svgParent, "chart_info": chart_info, "tooltip": tooltip, "title": title, "updateFunctions": updateFunctions}
	},

	processTag: function(plotTag) {
		var thisTag = ""
		try {
			thisTag = plotTag.tagName.toUpperCase()
		} catch (e) {
			throw "Invalid tag passed (type error)."
		}

		var valid_tag = false
		for (var i = 0; i < jsonToD3.valid_plot_tags.length; i++) {
			if (thisTag == jsonToD3.valid_plot_tags[i].toUpperCase()) {
				valid_tag = true
				break
			}
		}

		if (!valid_tag) {
			throw "Invalid tag passed."
		}

		var chart_info = jsonToD3.parseTagGetRawJSON(plotTag)
		return jsonToD3.makeChartCanvas(plotTag, chart_info)
	},

	work: function() {
		var chartArray = []
		if (jsonToD3.plotIdx == null) {
			jsonToD3.plotIdx = 0
		}
		if (jsonToD3.activeSeriesInCharts == null) {
			jsonToD3.activeSeriesInCharts = []
		}

		var plots = []

		jsonToD3.valid_plot_tags.forEach(function(pt) {
			var elems = document.getElementsByTagName(pt)
			for (var i = 0; i < elems.length; i++) {
				plots.push(elems[i])
			}
		})

		for (var i = 0; i < plots.length; i++) {
			var plotTag = plots[i]
			if (plotTag.getAttribute('processed') == null) {

				var chartCanvas = jsonToD3.processTag(plotTag)
				plotTag.setAttribute('processed', "")
				if (chartCanvas == null) {
					plotTag.setAttribute('rendered', false)
					continue
				} else {
					chartArray.push(chartCanvas)
				}

				plotTag.setAttribute('rendered', true)
			}
		}

		var runUpdateFunctions = null
		runUpdateFunctions = function() {
			if (jsonToD3.canMathJaxTypeSet()) {
				for (var i = 0; i < chartArray.length; i++) {
					for (var k in chartArray[i]["updateFunctions"]) {
						chartArray[i]["updateFunctions"][k]()
					}
				}
			}
			window.setTimeout(runUpdateFunctions, 333)
		}
		window.setTimeout(runUpdateFunctions(), 50)

		return chartArray;
	}
}