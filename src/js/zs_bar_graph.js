/**
 * Copyright 2015, Symantec Corporation
 * All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree
 */

'use strict';
/**
 *  @ngdoc directive
 *  @name zeus.viz.directive:zsBarGraph
 *  @restrict E
 *
 *  @description
 *  A directive for horizontal bar charts
 *
 *  @scope
 *
 *  @param {Array.<number>} values Values as array of numbers
 *  @param {function($val,$pos)=} tickFormatterY Callback function that accepts
 *  `value` and `position` of a data point and returns string
 *  @param {Array.<string>} seriesLabels Y axis labels for each of the bars
 *  @param {number=} leftMargin Optional left margin for text. Defaults to `80`
 *  @param {Object=} lastUpdate Can be used to refresh the graph
 *
 *  @example
 <example module="zeus.viz">
    <file name="index.html">
        <div ng-controller="myCtrl" style="height: 350px">
            <zs-bar-graph values="byFileGroup"
                last-update="lastUpdate"
                color-generator="fgColor($pos)"
                series-labels="seriesLabels"
                tooltip-formatter="fgTooltips($val,$pos)"
                tick-formatter-x="growthTickFormatter($val)">
            </zs-bar-graph>
        </div>
    </file>
    <file name="myCtrl.js">
        angular.module( 'zeus.viz' ).controller( 'myCtrl',
        function ( $scope, $interval ) {

            var colors = [ '#ff5722', '#8bc34a', '#ffc107', '#03a9f4',
                '#e91e63', '#009688' , '#ff9800' ],

                stop;

            $scope.byFileGroup = [
                100, 40, 50, 20, 10, 80
            ];

            $scope.seriesLabels = [
                'Men', 'Elves', 'Hobbits', 'Dwarves', 'Orcs', 'Goblins'
            ];

            $scope.fgColor = function ( pos ) {
                return colors[ pos ];
            };

            $scope.fgTooltips = function ( val, pos ) {
                return $scope.seriesLabels[ pos ] + ': ' + prettyNumberFilter( val );
            };

            $scope.growthTickFormatter = function ( val ) {
                return val;
            };

            stop = $interval( function () {
                $scope.byFileGroup = [
                    Math.random() * 1000, Math.random() * 1000, Math.random() * 1000,
                    Math.random() * 1000, Math.random() * 1000, Math.random() * 1000
                ];

                $scope.lastUpdate = ( new Date() ).getTime();

            }, 5000 );

            $scope.$on( '$destroy', function () {
                $interval.cancel( stop );
            } );

        } );
    </file>
 </example>
 **/
angular.module( 'zeus.viz' )
.directive( 'zsBarGraph', [ '$timeout', function ( $timeout ) {

        var postLink, renderChart, wrapLabel,
            margin = { top: 20, right: 20, bottom: 30, left: 80 };

        wrapLabel = function ( text, width ) {

            text.each( function () {
            var text = d3.select( this ),
                words = text.text().trim().split( /\s+/ ).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.1, // ems
                y = text.attr( 'y' ),
                dy = parseFloat( text.attr( 'dy' ) ),
                tspan = text.text( null ).append( 'tspan' ).
                        attr( 'x', 0 ).attr( 'y', y ).attr( 'dy', dy + 'em' );

                word = words.pop();
                while ( word ) {
                    line.push( word );
                    tspan.text( line.join( ' ' ) );
                    if ( tspan.node().getComputedTextLength() > width && line.length > 1 ) {
                        line.pop();
                        tspan.text( line.join( ' ' ) );
                        line = [ word ];
                        tspan = text.append( 'tspan' ).
                                attr( 'x', 0 ).
                                attr( 'y', y ).
                                attr( 'dy', ++lineNumber * lineHeight + dy + 'em' ).
                                text( word );
                    }
                    word = words.pop();
                }
            } );
        };
        renderChart = function ( scope, element, tip ) {

            // Early exit
            if ( !scope.values || !scope.values.length ) {
                return;
            }

            // Reset height of parent
            var parentEl = element[ 0 ].parentElement,
                leftMargin = +scope.leftMargin || margin.left,
                width, height,
                svg, graphCanvas, bars, xAxis, yAxis,
                x, y, xAxisLabels, xMax;

            svg = d3.select( element[ 0 ] );
            graphCanvas = svg.select( 'g' );


            svg.attr( 'width', 0 ).
                attr( 'height', 0 );

            width = parentEl.clientWidth - leftMargin - margin.right;
            height = scope.graphHeight ? +scope.graphHeight : parentEl.clientHeight;

            height = height - margin.top - margin.bottom;

            svg.attr( 'width', width + leftMargin + margin.right ).
                attr( 'height', height + margin.top + margin.bottom );

            y = d3.scale.ordinal().
                domain( scope.seriesLabels ).
                rangeRoundBands( [ height, 0 ], 0.2 );


            x = d3.scale.linear().rangeRound( [ 0, width ] );

            if ( scope.clampX ) {
                x.clamp( true ).domain( [ 0, scope.clampX ] );

            } else {
                xMax = d3.max( scope.values, function ( d ) {
                    return d;
                } );

                x.domain( [ 0, xMax ] );
            }

            xAxis = d3.svg.axis().scale( x ).orient( 'bottom' ).
                    tickFormat( function ( v ) {
                        return scope.tickFormatterX( { $val: v } );
                    } ).
                    innerTickSize( -height );

            yAxis = d3.svg.axis().
                    scale( y ).orient( 'left' ).
                    innerTickSize( -width );


            graphCanvas.attr( 'transform', 'translate(' + leftMargin + ',' + margin.top + ')' );
            graphCanvas.select( 'g.x-axis' ).
                attr( 'transform', 'translate(0,' + height + ')' ).
                transition().
                duration( 800 ).
                call( xAxis );

            xAxisLabels = graphCanvas.selectAll( 'g.x-axis .tick text' );
            xAxisLabels.call( wrapLabel, width / xAxisLabels.size() );

            graphCanvas.select( 'g.y-axis' ).
                transition().
                duration( 800 ).
                call( yAxis );

            bars = graphCanvas.select( 'g.chart-holder' ).
                    selectAll( 'rect.bar' ).data( scope.values );

            bars.attr( 'class', 'bar' ).
                transition().
                duration( 800 ).
                attr( 'fill', function ( d, i ) {
                    return scope.colorGenerator( { $pos: i } );
                } ).
                attr( 'y', function ( d, i ) {
                    return y( scope.seriesLabels[ i ] );
                } ).
                attr( 'x', function () { return 0; } ).
                attr( 'height', function () { return y.rangeBand(); } ).
                attr( 'width', function ( d ) {
                    return x( d );
                } ).
                attr( 'opacity', 0.75 );

            bars.enter().
                append( 'rect' ).
                attr( 'class', 'bar' ).
                attr( 'fill', function ( d, i ) {
                    return scope.colorGenerator( { $pos: i } );
                } ).
                transition().
                duration( 800 ).
                attr( 'y', function ( d, i ) {
                    return y( scope.seriesLabels[ i ] );
                } ).
                attr( 'x', function () { return 0; } ).
                attr( 'height', function () { return y.rangeBand(); } ).
                attr( 'width', function ( d ) {
                    return x( d );
                } ).
                attr( 'opacity', 0.75 );

            bars.exit().
                transition().
                attr( 'width', function () { return 0; } ).
                remove();

            bars.on( 'mouseover', function () {
                    tip.show.apply( this, arguments );
                    $( this ).attr( 'opacity', 1 );
                } ).
                on( 'mouseout', function () {
                        tip.hide.apply( this, arguments );
                        $( this ).attr( 'opacity', 0.75 );
                } );
        };

        postLink = function ( scope, element, attrs ) {

            var parent = $( element ).parent(),
                win = $( window ),
                svg, graphCanvas, resizeWait, tip;

            scope.leftMargin = attrs.leftMargin;

            svg = d3.select( element[ 0 ] ).attr( 'class', 'bar-graph' );

            tip = d3.tip().
                    attr( 'class', 'd3-tip' ).
                    offset( [ -10, 0 ] ).
                    html( function ( d, i ) {
                        console.log( d, i );
                        return scope.tooltipFormatter( {
                            $val: d,
                            $pos: i
                        } );
                    } );

            svg.call( tip );

            graphCanvas = svg.append( 'g' );

            graphCanvas.append( 'g' ).attr( 'class', 'axis x-axis' );
            graphCanvas.append( 'g' ).attr( 'class', 'axis y-axis' );
            graphCanvas.append( 'g' ).attr( 'class', 'chart-holder' );

            if ( parent.is( ':visible' ) ) {
                renderChart( scope, element, tip );
            }

            scope.$watch( function () {
                var isVisible = parent.is( ':visible' );
                return isVisible;
            }, function () {
                if ( parent.is( ':visible' ) ) {
                    renderChart( scope, element, tip );
                }
            } );

            win.on( 'resize.bar_graph_' + scope.$id, function () {
                var isVisible = parent.is( ':visible' );
                if ( resizeWait ) {
                    $timeout.cancel( resizeWait );
                }

                if ( !isVisible ) {
                    return;
                }
                resizeWait = $timeout( function () {
                    renderChart( scope, element, tip );
                }, 500 );
            } );

            scope.$on( '$destroy', function () {
                win.off( 'resize.bar_graph_' + scope.$id );
            } );

            scope.$watch( 'lastUpdate', function () {
                if ( parent.is( ':visible' ) ) {
                    renderChart( scope, element, tip );
                }
            } );
        };

        return {
            templateNamespace: 'svg',
            template: '<svg></svg>',
            restrict: 'E',
            replace: true,
            link: postLink,
            scope: {
                values: '=',
                tickFormatterX: '&',
                lastUpdate: '=',
                seriesLabels: '=',
                colorGenerator: '&',
                graphHeight: '=',
                tooltipFormatter: '&',
                clampX: '=?'
            }
        };

    }
] );
