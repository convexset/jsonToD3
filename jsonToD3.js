/*
JSON to D3 is a simple JavaScript utility for converting JSON-formatted text or JSON into D3 charts.

Original Motivation: To create a "text" to "charts" JavaScript utility so chart settings and data
might be embedded in directly in version-control friendly static documents like HTML... or JSON
files gettable by AJAX.

Copyright (c) 2014 Jeremy Chen

This code is licensed under the terms of the MIT License.


I currently don't dare to give a version number since it remains ugly and hackish. (Just look at how the settings are
organized...) But I'll get to that at some point...
*/

/*
TO DO:
- Create a ERR-IMG-SRC attribute
- Create a ERR-TEXT attribute
*/

var jsonToD3 = {
	DEVELOPMENT: false,

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
						url: external_data_source.toString(),
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
		return s.toString().toLowerCase().replace(/[^a-z0-9]/g, '')
	},

	get_series_key: function(unique_tag, s) {
		return unique_tag + "|" + jsonToD3.slugify(s)
	},

	get_title_tag: function(unique_tag) {
		return 'tag_' + unique_tag + 'title'
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
				if (MathJax.Hub.Typeset != null) {
					var getType = {}
					if (getType.toString.call(MathJax.Hub.Typeset) === '[object Function]') {
						return true
					}
				}
			}
		}
		return false
	},

	canMathJaxQueue: function() {
		if ("MathJax" in window) {
			if (MathJax.Hub != null) {
				if (MathJax.Hub.Queue != null) {
					var getType = {}
					if (getType.toString.call(MathJax.Hub.Queue) === '[object Function]') {
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

	doMathJaxQueueIfPossible: function(elem) {
		if (jsonToD3.canMathJaxQueue()) {
			MathJax.Hub.Queue(["Typeset",MathJax.Hub,elem])
		}
	},

	matchRGB: function(s) {
		var rgbRegEx1 = /^#[0-9A-Fa-f]{6}$/
		var rgbRegEx2 = /^#[0-9A-Fa-f]{3}$/
		return rgbRegEx1.test(s) || rgbRegEx2.test(s)
	},

	validatePointPlotSettings: function(info, plot_type, location, parent) {
		var errors = []

		if (info.use_series_in_chart != null) {
			info.use_series_in_chart = true && info.use_series_in_chart
		} else {
			info.use_series_in_chart = (parent != null) ? parent.use_series_in_chart : true
		}

		if (info.initially_hidden != null) {
			info.initially_hidden = true && info.initially_hidden
		} else {
			info.initially_hidden = (parent != null) ? parent.initially_hidden : false
		}

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

		var DEFAULT_MARKER_BORDER_COLOR = "#000"
		if (info.marker_border_color != null) {
			info.marker_border_color = info.marker_border_color.toString()
		} else {
			info.marker_border_color = (parent != null) ? parent.marker_border_color : DEFAULT_MARKER_BORDER_COLOR
		}
		if ((info.marker_border_color.toLowerCase() != "none") && (!jsonToD3.matchRGB(info.marker_border_color))) {
			errors.push("Invalid marker_border_color at " + location.toString() + ".")
		}

		if (info.use_markers != null) {
			info.use_markers = true && info.use_markers
		} else {
			info.use_markers = (parent != null) ? parent.use_markers : true
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

		var DEFAULT_LINE_INTERPOLATION = "linear"
		if (info.line_interpolation != null) {
			info.line_interpolation = info.line_interpolation.toString()
		} else {
			info.line_interpolation = (parent != null) ? parent.line_interpolation : DEFAULT_LINE_INTERPOLATION
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
			chart_info.tooltip_color = "#005"
		}

		if ((chart_info.tooltip_bgcolor != null) && (jsonToD3.matchRGB(chart_info.tooltip_bgcolor))) {
			chart_info.tooltip_bgcolor = chart_info.tooltip_bgcolor.toString()
		} else {
			chart_info.tooltip_bgcolor = "#ddd"
		}

		if (chart_info.tooltip_border != null) {
			chart_info.tooltip_border = chart_info.tooltip_border.toString()
		} else {
			chart_info.tooltip_border = "1px dotted"
		}

		if (chart_info.tooltip_font != null) {
			chart_info.tooltip_font = chart_info.tooltip_font.toString()
		} else {
			chart_info.tooltip_font = "12px Sans Serif"
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
			chart_info.axes_font = "12px Sans-Serif"
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
			newPoint.marker_border_color = ds.marker_border_color


			if (plot_type == "BUBBLEPLOT") {
				newPoint.marker_radius = ds.bubble_scale * newPoint.z
			}
			if (plot_type == "SCATTERPLOT") {
				if (ds.use_markers) {
					newPoint.marker_radius = ds.marker_radius
				} else if (isFinite(ds.line_width) && isFinite(ds.line_opacity)) {
					newPoint.marker_opacity = ds.line_opacity
					newPoint.marker_radius = ds.line_width / 2.0
					newPoint.marker_border_color = "none"
				} else {
					newPoint.marker_opacity = 0
					newPoint.marker_radius = 0
					newPoint.marker_border_color = "none"
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

		var all_data_markers = []
		var all_data_lines = []

		for (var i = 0; i < chart_info.data_series.length; i++) {
			var ds = chart_info.data_series[i]

			if (!jsonToD3.validatePointPlotSettings(ds, chart_info.plot_type, ds.series_name, chart_info)) {
				errors.push("Settings validation failed for series \"" + ds.series_name + "\".")
			}

			if (ds.data == null) { errors.push("Error: data not defined in series \"" + ds.series_name + "\".") }
			if (ds.data.length == null) { errors.push("Invalid data in series \"" + ds.series_name + "\".") }

			var data_description = jsonToD3.checkAndParsePointsAndLabel(ds, chart_info.plot_type, chart_info.axes.has_datetime_x_axis, chart_info.axes.has_datetime_y_axis)
			if (data_description != null) {
				ds.data_description = data_description
			} else {
				return false
			}
		}

		var tmp_series = chart_info.data_series
		chart_info.data_series = []
		for (var i = 0; i < tmp_series.length; i++) {
			if (tmp_series[i].use_series_in_chart) {
				chart_info.data_series.push(tmp_series[i])
			}
		}

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

			chart_data_description.x_min = chart_data_description.x_min < ds.data_description.x_min ? chart_data_description.x_min : ds.data_description.x_min
			chart_data_description.x_max = chart_data_description.x_max > ds.data_description.x_max ? chart_data_description.x_max : ds.data_description.x_max
			chart_data_description.y_min = chart_data_description.y_min < ds.data_description.y_min ? chart_data_description.y_min : ds.data_description.y_min
			chart_data_description.y_max = chart_data_description.y_max > ds.data_description.y_max ? chart_data_description.y_max : ds.data_description.y_max

			var points = ds.data
			for (var j = 0; j < points.length; j++) {
				if (ds.use_markers && ((chart_info.plot_type == "BUBBLEPLOT") || (points[j].marker_radius > 0))) {
					all_data_markers.push(points[j])
				}
			}
			if (ds.draw_line) {
				for (var j = 0; j < points.length; j++) {
					all_data_lines.push(points[j])
				}
			}
		}

		chart_info.all_data_markers = all_data_markers
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
		var managementFunctions = {}
		var fewTimeUpdateFunctions = {}
		var divLabels = {}

		var svg = null
		try {
			var margins = chart_info.margins
			var width = chart_info.dimensions.width
			var height = chart_info.dimensions.height
			var inner_width = width - margins.left - margins.right
			var inner_height = height - margins.top - margins.bottom

			var data_markers = chart_info.all_data_markers
			var data_lines = chart_info.all_data_lines

			var unique_tag = "JSON_TO_D3_CHARTAREA" + (++jsonToD3.plotIdx).toString()
			while (document.getElementById(unique_tag) != null) {
				unique_tag = "JSON_TO_DTHREE_CHARTAREA" + (++jsonToD3.plotIdx).toString()
			}

			var body = document.getElementsByTagName("BODY")[0]
			var sneakyDiv = document.createElement("DIV")
			sneakyDiv.setAttribute("id", "SneakyDiv")
			body.appendChild(sneakyDiv)


			// Setup canvas
			var unique_tag_element = document.createElement("DIV")
			unique_tag_element.setAttribute("id", unique_tag)
			unique_tag_element.style.width = width + "px"
			unique_tag_element.style.height = height + "px"
			var svgParent = plotTag.appendChild(unique_tag_element)
			var svg = d3.select(unique_tag_element).append("svg")
							.style("position", "relative")
							.style("width", width + "px")
							.style("height", height + "px")
							.append("g")
							.attr("transform", "translate(" + margins.left + "," + margins.top + ")")


			var tooltip = null

		    // Various Event Handlers
			var getSeriesKey = function(d) {
				return jsonToD3.get_series_key(unique_tag, d)
			}

			var moveTooltipOnMouseMove = function() {
				tooltip
					.style("left", (d3.event.pageX + 15) + "px")
					.style("top", (d3.event.pageY + 15) + "px")
			}

			var fadeToolTip = function() {
				tooltip.transition()
					.duration(300)
					.style("opacity", 0);
			}
			managementFunctions["fadeToolTip"] = fadeToolTip

			var showOrHideSeries = function(d, active) {
				var key = getSeriesKey(d)
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
			}
			managementFunctions["showOrHideSeries"] = showOrHideSeries

			var toggleFadeSeries = function(d) {
				var key = getSeriesKey(d)
				showOrHideSeries(d, !jsonToD3.activeSeriesInCharts[key]['active'])
				fadeToolTip()
			}
			managementFunctions["toggleFadeSeries"] = toggleFadeSeries

			var fadeOtherSeriesShowThisOnly = function(d) {
				for (var i = 0; i < chart_info.data_series.length; i++) {
					var other_d = chart_info.data_series[i].series_name
					showOrHideSeries(other_d, (other_d == d))
				}
				fadeToolTip()
			}
			managementFunctions["fadeOtherSeriesShowThisOnly"] = fadeOtherSeriesShowThisOnly

			showAllSeries = function() {
				for (var i = 0; i < chart_info.data_series.length; i++) {
					showOrHideSeries(chart_info.data_series[i].series_name, true)
				}
				fadeToolTip()
			}
			managementFunctions["showAllSeries"] = showAllSeries

			var markerMouseOver = function(d) {
				var key = getSeriesKey(cValue(d))
				var isActive = jsonToD3.activeSeriesInCharts[key]['active']
				if (!isActive) { return }

				var tooltip_text = ""
				if (d.id == "") {
					tooltip_text = "<div>(" + xValueTT(d) + ", " + yValueTT(d) + ")" + "<br/><em>" + cValue(d) + "</em></div>"
				} else {
					tooltip_text = "<div><b>" + d.id + "</b><br/>(" + xValueTT(d) + ", " + yValueTT(d) + ")" + "<br/><em>" + cValue(d) + "</em></div>"
				}

				sneakyDiv.setAttribute("style", "position: absolute; visibility: hidden; height: auto; width: auto; font: " + chart_info.tooltip_font + "; padding: " + tooltip_padding + "px;")
				sneakyDiv.innerHTML = tooltip_text
					jsonToD3.doMathJaxTypeSetIfPossible(sneakyDiv)

				tooltip
					.style("width", (sneakyDiv.clientWidth + 2) + "px")
					.style("height", (sneakyDiv.clientHeight + 2) + "px")

				tooltip.html(sneakyDiv.innerHTML)

				moveTooltipOnMouseMove()

				tooltip.transition()
					.duration(200)
					.style("opacity", .9)
			}


			var title = null
			if (chart_info.title != "") {

				var titleMouseOver = function() {
					var tooltip_text = "Click the title to show all series."

					sneakyDiv.setAttribute("style", "position: absolute; visibility: hidden; height: auto; width: auto; font: " + chart_info.tooltip_font + "; padding: " + tooltip_padding + "px;")
					sneakyDiv.innerHTML = tooltip_text

					tooltip
						.style("width", (sneakyDiv.clientWidth + 2) + "px")
						.style("height", (sneakyDiv.clientHeight + 2) + "px")

					tooltip.html(sneakyDiv.innerHTML)

					moveTooltipOnMouseMove()

					tooltip.transition()
						.duration(200)
						.style("opacity", .9)
				}

				title = d3.select(unique_tag_element).append("div")
								.attr("class", "jsonToD3_title")
								.attr("id", jsonToD3.get_title_tag(unique_tag))
								.style("position", "absolute")
								.style("width", inner_width + "px")
								.style("height", "auto")
								.style("font", chart_info.title_font)
								.style("text-align", "center")
								.style("vertical-align", "top")
								.style("text-decoration", chart_info.title_underline ? "underline" : "none")
								.style("cursor", "pointer")
								.style("left", (unique_tag_element.offsetLeft + margins.left) + "px")
								.style("top", (unique_tag_element.offsetTop) + "px")
								.html(chart_info.title)
								.on("click", showAllSeries)
								.on("mouseover", titleMouseOver)
								.on("mousemove", moveTooltipOnMouseMove)
								.on("mouseout", fadeToolTip)
				if (jsonToD3.DEVELOPMENT) {title.style("background-color", "#00F").style("opacity", 0.8)} // ****** DEBUG *******

				updateFunctions["positionTitle"] = function() {
					var titleTag = document.getElementById(jsonToD3.get_title_tag(unique_tag))
					title
						.style("left", (unique_tag_element.offsetLeft + margins.left) + "px")
						.style("top", (unique_tag_element.offsetTop + margins.top - titleTag.clientHeight - 4) + "px")
				}
				updateFunctions["positionTitle"]()
				divLabels["title"] = title
			}



			// font size things...
			var textHeight = 0
			var textWidth = 0
			var tooltip_padding = 0


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

			// sneakyDiv for browsers which seem to not be able to give clientWidth and clientHeight properly
			sneakyDiv.setAttribute("style", "position: absolute; visibility: hidden; height: auto; width: auto; font: " + chart_info.axes_font + ";")
			var getXAxisHeight = function (node) {
				try {
					sneakyDiv.innerHTML = node.childNodes[1].textContent
					return Math.abs(node.childNodes[0].y2.baseVal.value - node.childNodes[0].y1.baseVal.value) + 1 + Math.max(node.childNodes[1].clientHeight, sneakyDiv.clientHeight)
				} catch (e) {
					return -1
				}
			}
			var vert_padding_x_axis = jsonToD3.reduce(Math.max, jsonToD3.map(getXAxisHeight, x_axis[0][0].childNodes), -Infinity)

			var x_axis_label = d3.select(unique_tag_element).append("div")
								.attr("class", "jsonToD3_label")
								.style("position", "absolute")
								.style("width", inner_width + "px")
								.style("height", "auto")
								.style("font", chart_info.axes_label_font)
								.style("text-align", "center")
								.style("vertical-align", "top")
								.html(chart_info.axes.x_label)
			if (jsonToD3.DEVELOPMENT) {x_axis_label.style("background-color", "#00F").style("opacity", 0.8)} // ****** DEBUG *******

			updateFunctions["positionXAxisLabel"] = function() {
				x_axis_label
					.style("left", (unique_tag_element.offsetLeft + margins.left) + "px")
					.style("top", (unique_tag_element.offsetTop + margins.top + inner_height + vert_padding_x_axis) + "px")
			}
			updateFunctions["positionXAxisLabel"]()
			divLabels["x_axis_label"] = x_axis_label

			// y-axis
			var y_axis = svg.append("g")
						.attr("class", "y axis")
						.call(yAxis)
						.style("fill", "#000") // Y Tick Labels
						.style("font", chart_info.axes_font)

			// sneakyDiv for browsers which seem to not be able to give clientWidth and clientHeight properly
			sneakyDiv.setAttribute("style", "position: absolute; visibility: hidden; height: auto; width: auto; font: " + chart_info.axes_font + ";")
			var getYAxisWidth = function (node) {
				try {
					sneakyDiv.innerHTML = node.childNodes[1].textContent
					return Math.abs(node.childNodes[0].x2.baseVal.value - node.childNodes[0].x1.baseVal.value) + 1 + Math.max(node.childNodes[1].clientWidth, sneakyDiv.clientWidth)
				} catch (e) {
					return -1
				}
			}
			var horiz_padding_y_axis = jsonToD3.reduce(Math.max, jsonToD3.map(getYAxisWidth, y_axis[0][0].childNodes), -Infinity)

			sneakyDiv.setAttribute("style", "position: absolute; visibility: hidden; height: auto; width: auto; font: " + chart_info.axes_label_font + ";")
			sneakyDiv.innerHTML = chart_info.axes.y_label
			var y_axis_textHeight = sneakyDiv.clientHeight
			textWidth = sneakyDiv.clientWidth

			var y_axis_label = d3.select(unique_tag_element).append("div")
								.attr("class", "jsonToD3_label")
								.style("position", "absolute")
								.style("text-align", "center")
								.style("vertical-align", "top")
								.style("width", inner_height + "px")
								.style("height", "auto")
								.style("font", chart_info.axes_label_font)
								.style("transform", "rotate(-90deg)")
								.style("-webkit-transform", "rotate(-90deg)")
								.style("-moz-transform", "rotate(-90deg)")
								.style("-o-transform", "rotate(-90deg)")
								.style("-ms-transform", "rotate(-90deg)")
								.style("transform-origin", "0% 0%")
								.style("-webkit-transform-origin", "0% 0%")
								.style("-ms-transform-origin", "0% 0%")
								.html(chart_info.axes.y_label)
			if (jsonToD3.DEVELOPMENT) {y_axis_label.style("background-color", "#00F").style("opacity", 0.8)} // ****** DEBUG *******

			updateFunctions["positionYAxisLabel"] = function() {
				y_axis_label
					.style("left", (unique_tag_element.offsetLeft + margins.left - horiz_padding_y_axis - y_axis_textHeight - 4) + "px")
					.style("top", (unique_tag_element.offsetTop + margins.top + inner_height) + "px")
			}
			updateFunctions["positionYAxisLabel"]()
			divLabels["y_axis_label"] = y_axis_label

			svg.selectAll(".axis line")
					.style("stroke", "#000") // Ticks
					.style("fill", "none")
					.style("shape-rendering", "crispEdges")

			svg.selectAll(".axis path")
					.style("stroke", "#000") // Axes proper
					.style("fill", "none")
					.style("shape-rendering", "crispEdges")

			// Preserve series order
		    for (var i = 0; i < chart_info.data_series.length; i++) {
		    	color(chart_info.data_series[i].series_name)
		    }

			// draw lines
		    for (var i = 0; i < chart_info.data_series.length; i++) {
		    	var ds = chart_info.data_series[i]

				var line = d3.svg.line()
				    .x(function(d) { return xMap(d) })
				    .y(function(d) { return yMap(d) })
					.interpolate(ds.line_interpolation)

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

			// draw markers
			svg.selectAll(".marker")
					.data(data_markers)
				.enter().append("circle")
					.attr("class", "marker")
					.attr("r", function(d) {return d.marker_radius})
					.attr("cx", xMap)
					.attr("cy", yMap)
					.attr("id", function(d) {return jsonToD3.get_node_tag(unique_tag, d.series_name)}) // assign ID
					.style("opacity", function(d) {return d.marker_opacity})
					.style("stroke", function(d) {return d.marker_border_color})
					.style("fill", function(d) {return color(cValue(d))})
					.style("cursor", "crosshair")
					.on("mouseover", markerMouseOver)
					.on("mousemove", moveTooltipOnMouseMove)
					.on("mouseout", fadeToolTip)

			for (var i = 0; i < chart_info.data_series.length; i++) {
				var ds = chart_info.data_series[i]
				var key = getSeriesKey(ds.series_name)
				jsonToD3.activeSeriesInCharts[key] = {}
				jsonToD3.activeSeriesInCharts[key]['active'] = true
				jsonToD3.activeSeriesInCharts[key]['org_opacity'] = {}
				jsonToD3.activeSeriesInCharts[key]['org_opacity'][jsonToD3.get_node_tag(unique_tag, ds.series_name)] = ds.marker_opacity
				jsonToD3.activeSeriesInCharts[key]['org_opacity'][jsonToD3.get_path_tag(unique_tag, ds.series_name)] = ds.line_opacity
			}

			if (chart_info.show_legend) {
				var legend_shift_x = chart_info.legend_offset_x
				var legend_shift_y = chart_info.legend_offset_y

				sneakyDiv.setAttribute("style", "position: absolute; visibility: hidden; height: auto; width: auto; font: " + chart_info.legend_font + ";")
				sneakyDiv.innerHTML = "abcdefghijklmnopqrstuvwxyz" + "abcdefghijklmnopqrstuvwxyz".toUpperCase()

				textHeight = sneakyDiv.clientHeight
				var legendDeltaGap = 3
				var legendSquareSide = textHeight + 4
				var legendSquareSidePlus = legendSquareSide + legendDeltaGap

				var legendWidth = -Infinity
				var legendBorderShift = 1 + Math.floor(legendSquareSide / 3.0)

				var legendMouseOver = function(d) {
					var key = getSeriesKey(d)
					var isActive = jsonToD3.activeSeriesInCharts[key]['active']

					var tooltip_text = "<b>" + d + "</b><br/>" + (isActive ? "(Click to hide)" : "(Click to show)")
					tooltip_text += "<br/>(Right click to show only this.)"
					if (title != null) {
						tooltip_text += "<br/>(Click the title to show all series.)"
					}

					sneakyDiv.setAttribute("style", "position: absolute; visibility: hidden; height: auto; width: auto; font: " + chart_info.tooltip_font + "; padding: " + tooltip_padding + "px;")
					sneakyDiv.innerHTML = tooltip_text
					jsonToD3.doMathJaxTypeSetIfPossible(sneakyDiv)

					tooltip.html(sneakyDiv.innerHTML)
						.style("width", (sneakyDiv.clientWidth + 2) + "px")
						.style("height", (sneakyDiv.clientHeight + 2) + "px")

					moveTooltipOnMouseMove()

					tooltip.transition()
						.duration(200)
						.style("opacity", .9)
				}


				// draw legend background first
				var legend_bg = svg.append("rect")
									.style("stroke", "#000")
									.style("stroke-width", 3)
									.style("fill", "#666")
									.style("opacity", 0.15)

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
					.on("click", toggleFadeSeries)
					.on("contextmenu", function(d){ d3.event.preventDefault(); fadeOtherSeriesShowThisOnly(d); })
					.on("mouseover", legendMouseOver)
					.on("mousemove", moveTooltipOnMouseMove)
					.on("mouseout", fadeToolTip)

				var legend_labels = []

				var getLegendTextCallBacks = function(d) {
					var name = d.toString()
					var CBs = {}
					CBs["click"] = function() {toggleFadeSeries(name)}
					CBs["contextmenu"] = function() {d3.event.preventDefault(); fadeOtherSeriesShowThisOnly(name);}
					CBs["mouseover"] = function() {legendMouseOver(name)}
					return CBs
				}

				// This hack is used because somehow color.domain() gives all the series, but .enter() leaves out the first. No idea why.
				for (var i = 0; i < chart_info.data_series.length; i++) {
					var d = chart_info.data_series[i].series_name
					var CBs = getLegendTextCallBacks(d)

					var legend_label = d3.select(unique_tag_element)
									.append("div")
									.attr("class", "jsonToD3_legend")
									.style("position", "absolute")
									.style("text-align", "right")
									.style("vertical-align", "middle")
									.style("cursor", "pointer")
									.style("font", chart_info.legend_font)
									.attr("id", jsonToD3.get_legend_div_tag(unique_tag, d)) // assign ID
									.on("click", CBs["click"])
									.on("contextmenu", CBs["contextmenu"])
									.on("mouseover", CBs["mouseover"])
									.on("mousemove", moveTooltipOnMouseMove)
									.on("mouseout", fadeToolTip)
					if (jsonToD3.DEVELOPMENT) {legend_label.style("background-color", "#00F").style("opacity", 0.8)} // ****** DEBUG *******

					legend_labels.push(legend_label)
				}

				var legendWidth = -Infinity
				var legendDivHTML = {}

				fewTimeUpdateFunctions["legendDivLabels"] = function() {
					sneakyDiv.setAttribute("style", "position: absolute; visibility: hidden; height: auto; width: auto; font: " + chart_info.legend_font + ";")

					for (var i = 0; i < chart_info.data_series.length; i++) {
						var d = chart_info.data_series[i].series_name
						var legend_label = legend_labels[i]

						sneakyDiv.innerHTML=d
						jsonToD3.doMathJaxTypeSetIfPossible(sneakyDiv)

						legendDivHTML[d] = sneakyDiv.innerHTML

						legend_label
							.style("width", (sneakyDiv.clientWidth + 2) + "px")
							.html(legendDivHTML[d])
					}
				}
				fewTimeUpdateFunctions["legendDivLabels"]()

				updateFunctions["positionLegend"] = function() {
					legendWidth = -Infinity

					for (var i = 0; i < chart_info.data_series.length; i++) {
						var d = chart_info.data_series[i].series_name
						var legend_label = legend_labels[i]

						var thisLegendDivWidth = legend_label[0][0].clientWidth + 2

						legendWidth = legendWidth > thisLegendDivWidth + 6 + legendSquareSide ? legendWidth : thisLegendDivWidth + 6 + legendSquareSide

						var leftPos = unique_tag_element.offsetLeft + legend_shift_x + margins.left + inner_width + margins.right - thisLegendDivWidth - legendSquareSide - 6 - legendBorderShift
						var topPos = unique_tag_element.offsetTop + legend_shift_y + margins.top + 2 + (i * legendSquareSidePlus) + legendBorderShift

						legend_label
							.style("left", leftPos + "px")
							.style("top", topPos + "px")
					}

					legend_bg.attr("x", (inner_width + margins.right + legend_shift_x - legendWidth - 2*legendBorderShift + 1))
							.attr("y", (0 + legend_shift_y + 1))
							.attr("width", (legendWidth + 2*legendBorderShift - 2))
							.attr("height", ((legendSquareSidePlus * chart_info.data_series.length - legendDeltaGap) + 2*legendBorderShift - 2))
				}
				updateFunctions["positionLegend"]()
				divLabels["legend_labels"] = legend_labels


				// tool tip... so it's on top
				sneakyDiv.setAttribute("style", "position: absolute; visibility: hidden; height: auto; width: auto; font: " + chart_info.tooltip_font + ";")
				sneakyDiv.innerHTML = "abcdefghijklmnopqrstuvwxyz" + "abcdefghijklmnopqrstuvwxyz".toUpperCase()
				textHeight = sneakyDiv.clientHeight
				textWidth = sneakyDiv.clientWidth

				tooltip_padding = Math.max(2,Math.ceil(textHeight/3.0))

				tooltip = d3.select(unique_tag_element).append("div")
									.attr("class", "jsonToD3_tooltip")
									.style("opacity", 0)
									.style("position", "absolute")
									.style("padding", tooltip_padding + "px")
									.style("width", Math.max(100, Math.ceil(textWidth/2.5)) + "px")
									.style("height", Math.max(30, 4 + 4*textHeight) + "px")
									.style("pointer-events", "none")
									.style("text-align", "left")
									.style("vertical-align", "middle")
									.style("color", chart_info.tooltip_color)
									.style("background-color", chart_info.tooltip_bgcolor)
									.style("border", chart_info.tooltip_border)
									.style("font", chart_info.tooltip_font)

			}
			// body.removeChild(sneakyDiv) // Keep this little guy for later use

		} catch(error) {
			plotTag.setAttribute('error', "Unable to generate chart canvas.")
			if (jsonToD3.DEVELOPMENT) {
				throw error
			} else {
				return null
			}
		}

		// Post Admin
		var seriesNames = []
		sneakyDiv.innerHTML = chart_info.title + " " + chart_info.x_label + chart_info.y_label
		for (var i = 0; i < chart_info.data_series.length; i++) {
			seriesNames.push(chart_info.data_series[i].series_name)
			if (chart_info.data_series[i].initially_hidden) {
				managementFunctions["showOrHideSeries"](chart_info.data_series[i].series_name, false)
			}
		}

		fewTimeUpdateFunctions["titleAndAxisLabels"] = function() {
			sneakyDiv.setAttribute("style", "position: absolute; visibility: hidden; height: auto; width: auto; font: " + chart_info.title_font + ";")

			sneakyDiv.innerHTML = chart_info.title
			jsonToD3.doMathJaxTypeSetIfPossible(sneakyDiv)
			title.html(sneakyDiv.innerHTML)

			sneakyDiv.setAttribute("style", "position: absolute; visibility: hidden; height: auto; width: auto; font: " + chart_info.axes_label_font + ";")

			sneakyDiv.innerHTML = chart_info.axes.y_label
			y_axis_textHeight = sneakyDiv.clientHeight
			jsonToD3.doMathJaxTypeSetIfPossible(sneakyDiv)
			y_axis_label.html(sneakyDiv.innerHTML)

			sneakyDiv.innerHTML = chart_info.axes.x_label
			jsonToD3.doMathJaxTypeSetIfPossible(sneakyDiv)
			x_axis_label.html(sneakyDiv.innerHTML)
		}

		var ret = {
					"seriesNames": seriesNames,
					"svg": svg, "svgParent": svgParent,
					"chart_info": chart_info, "tooltip": tooltip,
					"fewTimeUpdateFunctions": fewTimeUpdateFunctions,
					"updateFunctions": updateFunctions,
					"managementFunctions": managementFunctions
				}

		if (jsonToD3.DEVELOPMENT) { ret["divLabels"] = divLabels}
		return ret
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
			window.setTimeout(runUpdateFunctions, 50)
		}
		window.setTimeout(runUpdateFunctions, 50)

		var number_of_times_left_to_run_hackish_update_functions = 5
		var runFewTimeUpdateFunctions = null
		runFewTimeUpdateFunctions = function() {
			if (jsonToD3.canMathJaxTypeSet() && jsonToD3.canMathJaxQueue()) {
				number_of_times_left_to_run_hackish_update_functions--
				for (var i = 0; i < chartArray.length; i++) {
					for (var k in chartArray[i]["fewTimeUpdateFunctions"]) {
						chartArray[i]["fewTimeUpdateFunctions"][k]()
					}
				}
			}
			if (number_of_times_left_to_run_hackish_update_functions > 0) {
				window.setTimeout(runFewTimeUpdateFunctions, 5000)
			}
		}
		window.setTimeout(runFewTimeUpdateFunctions, 1000)

		return chartArray;
	}
}