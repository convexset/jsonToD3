JSON to D3 (v0.1.3)
---

JSON to D3 is a simple JavaScript utility for converting JSON-formatted text or JSON into D3 charts.

Original Motivation: To create a "text" to "charts" JavaScript utility so chart settings and data might be embedded in directly in version-control friendly static documents like HTML... or JSON files gettable by AJAX.

Copyright (c) 2014 Jeremy Chen

This code is licensed under the terms of the MIT License.


### Features
- Does reasonably nice scatter plots and bar charts (from <SCATTERPLOT>) and bubble plots (from <BUBBLEPLOT>)
- Processes chart info inline (in HTML tags) or loaded from somewhere specified by the SRC attribute
- Allows hiding of data series if things are too cluttered (mouse over the legend to find out more)
- Allows from LaTeX markup in the title, axis labels, legend labels and tool tips via barely passable integration with MathJax
- Setting "inheritance" from the chart to component data series (see below)
- Seems to work reasonably well in Chrome, FireFox and Safari (for everything else, there's MasterCard)
- When chart load fails, replace with a captioned (ERR-TEXT) and styled (ERR-IMG-STYLE) image (ERR-IMG-SRC) in a styled (ERR-STYLE) DIV with some class (ERR-CLASS). In contrast, successful renders tack on a caption if RENDER-TEXT is specified, with some style (RENDER-TEXT-STYLE) and some class (RENDER-TEXT-CLASS).


### On the Horizon
- Pie charts
- Graph (as in "network") plots


### Getting Started
1. Load D3 (designed and tested with 3.4.11)
2. Load jQuery if loading chart data using the SRC attribute (designed and tested with 2.1.1)
3. Load MathJax if using equations in titles, axis labels, legend labels, or point labels.
4. Load jsonToD3.js.
5. Call jsonToD3.work() or jsonToD3.work_NoMathJax() from a body.onload handler (the latter is for non-use of MathJax).

An example MathJax configuration that works:
```html
<script type="text/x-mathjax-config">
  MathJax.Hub.Config({
    extensions: ["tex2jax.js"],
    jax: ["input/TeX", "output/HTML-CSS"],
    tex2jax: {
      inlineMath: [ ['$','$'], ["\\(","\\)"] ],
      displayMath: [ ['$$','$$'], ["\\[","\\]"] ],
      processEscapes: true
    },
    "messageStyle" : "none",
    "HTML-CSS": { availableFonts: ["TeX"] },
    "delayStartupUntil" : "configured"
  });

  // Call MathJax.Hub.Configured() when ready to have MathJax start up.
  //    This is important for inline chart descriptions with LaTeX
  //    mark up. (Otherwise MathJax makes the JSON unparseable.)
</script>
```


### Settings:
- Data series settings include:
    * use_series_in_chart (boolean; default: true)
    * initially_hidden (boolean; default: false)
    * use_markers (boolean; default: true)
    * marker_opacity (0 to 1; default: 1)
    * marker_radius (default: 3.5)
    * marker_border_color (rgb; default: "#000" / "#000000")
    * draw_line (boolean; default: true)
    * line_opacity (0 to 1; default: 1)
    * line_width (default: 1.5)
    * line_interpolation (default: "linear"; see possible options)
        + linear - piecewise linear segments, as in a polyline.
        + step-before - alternate between vertical and horizontal segments, as in a step function.
        + step-after - alternate between horizontal and vertical segments, as in a step function.
        + basis - a B-spline, with control point duplication on the ends.
        + basis-open - an open B-spline; may not intersect the start or end.
        + basis-closed - a closed B-spline, as in a loop.
        + bundle - equivalent to basis, except the tension parameter is used to straighten the spline.
        + cardinal - a Cardinal spline, with control point duplication on the ends.
        + cardinal-open - an open Cardinal spline; may not intersect the start or end, but will intersect other control points.
        + cardinal-closed - a closed Cardinal spline, as in a loop.
        + monotone - cubic interpolation that preserves monotonicity in y
    * bubble_scale (default: 25)
    * bar_opacity (0 to 1; default: 1)
    * bar_border_color (rgb; default: "#000" / "#000000")
    * bar_border_thickness (positive integer; default: 1)
- Chart level settings
    * dimensions
        + width
        + height
    * margins
        + left
        + right
        + top
        + bottom
    * axes
        + x_label (string)
        + y_label (string)
        + x_min (plot domain; floating point number; default given by data)
        + y_max (plot domain; floating point number; default given by data)
        + y_min (plot domain; floating point number; default given by data)
        + x_max (plot domain; floating point number; default given by data)
        + x_axis_format (string; [More info](https://github.com/mbostock/d3/wiki/Formatting))
        + y_axis_format (string; [More info](https://github.com/mbostock/d3/wiki/Formatting))
        + has_datetime_y_axis (boolean; default: false)
        + has_datetime_x_axis (boolean; default: false)
        + x_ticks (approximate number of ticks on axis; positive integer)
        + y_ticks (approximate number of ticks on axis; positive integer)

    * title_font (string; default: "bold 14px Sans-Serif"; [More info](http://www.w3schools.com/cssref/pr_font_font.asp))
    * axes_font (string; see: default: "12px Sans-Serif"; [More info](http://www.w3schools.com/cssref/pr_font_font.asp))
    * axes_label_font (string; default: "bold 12px Sans-Serif"; [More info](http://www.w3schools.com/cssref/pr_font_font.asp))
    * legend_font (string; default: "12px Sans-Serif"; [More info](http://www.w3schools.com/cssref/pr_font_font.asp))
    * tooltip_font (string; default: "12px Sans Serif"; [More info](http://www.w3schools.com/cssref/pr_font_font.asp))

    * title (string)
    * title_underline (boolean; default: false)

    * show_legend (boolean; default: true)
    * legend_offset_x (for shifting the legend; integer; default: 0)
    * legend_offset_y (for shifting the legend; integer; default: 0)

    * tooltip_color (rgb; default: "#005" / "#000055")
    * tooltip_bgcolor (rgb; default: "#ddd" / "#dddddd")
    * tooltip_border (rgb; default: "1px dotted"; [More info](http://www.w3schools.com/cssref/pr_border.asp))

- Chart level settings include all of the data series settings. If something is set at the chart level and not at the data series level, the data series will inherit the chart level setting. Whatever is not set that the chart level is assumed to take the default. (I mean+ that's what default means+)