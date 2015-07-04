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
 *  @name zeus.viz.directive:zsHistogram
 *  @restrict E
 *
 *  @description
 *  A directive for vertical bar charts
 *
 *  @scope
 *
 *  @param {Array.<number>} values Values as array of numbers
 *  @param {Array.<string>} seriesLabels X axis labels for each of the bars
 *  @param {Object=} lastUpdate Can be used to refresh the graph
 *  @param {function($pos)} colorGenerator Callback function that returns
 *  colors for the bars.
 *  @param {function($val,$pos)} tooltipFormatter Callback that return the
 *  text to be displayed in tooltip for each bar.
 *
 *  @example
 <example module="zeus.viz">
    <file name="index.html">
        <div ng-controller="myCtrl" style="height: 400px; width: 500px;">
            <zs-histogram values="values"
                last-update="lastUpdate"
                color-generator="fgColor($pos)"
                series-labels="seriesLabels"
                tooltip-formatter="fgTooltips($val,$pos)">
            </zs-histogram>
        </div>
    </file>
    <file name="myCtrl.js">
        angular.module( 'zeus.viz' ).controller( 'myCtrl',
        function ( $scope, $interval ) {

            var colors = [ '#ff5722', '#8bc34a', '#ffc107', '#03a9f4',
                '#e91e63', '#009688' , '#ff9800' ],

                stop;

            $scope.values = [
                100, 40, 50, 20, 10, 80
            ];

            $scope.seriesLabels = [
                'Men', 'Elves', 'Hobbits', 'Dwarves', 'Orcs', 'Goblins'
            ];

            $scope.fgColor = function ( pos ) {
                return colors[ pos ];
            };

            $scope.fgTooltips = function ( val, pos ) {
                return $scope.seriesLabels[ pos ] + ': ' + val;
            };

            stop = $interval( function () {
                $scope.values = [
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
    .directive( 'zsHistogram', [ '$timeout', function ( $timeout ) {

        var MARGINS = { top: 20, right: 30, bottom: 30, left: 40 },
            postLink, renderChart;

        renderChart = function ( scope, element, tip ) {
            if ( !scope.values || !scope.values.length ) {
                return;
            }

            var parent = element[ 0 ].parentElement,
                svg, graphCanvas, xAxis, yAxis, bars,
                width, height, x, y;

            svg = d3.select( element[ 0 ] );
            graphCanvas = svg.select( 'g' );

            svg.attr( 'width', 0 )
                .attr( 'height', 0 );

            width = parent.clientWidth - MARGINS.left - MARGINS.right;
            height = parent.clientHeight - MARGINS.top - MARGINS.bottom;

            svg.attr( 'width', width + MARGINS.left + MARGINS.right )
                .attr( 'height', height + MARGINS.top + MARGINS.bottom );

            graphCanvas.attr( 'transform', 'translate(' +
                         MARGINS.left + ',' + MARGINS.top + ')' );

            x = d3.scale.ordinal()
                    .domain( scope.seriesLabels )
                    .rangeRoundBands( [ 0, width ], 0.1 );

            y = d3.scale.linear()
                    .domain( [ 0, d3.max( scope.values ) ] )
                    .range( [ height, 0 ] );

            xAxis = d3.svg.axis()
                        .scale( x )
                        .orient( 'bottom' );

            yAxis = d3.svg.axis()
                        .scale( y )
                        .orient( 'left' );

            graphCanvas.select( 'g.x-axis' )
                .attr( 'transform', 'translate(0, ' + height + ')' )
                .transition()
                .duration( 800 )
                .call( xAxis );

            graphCanvas.select( 'g.y-axis' )
                .transition()
                .duration( 800 )
                .call( yAxis );

            bars = graphCanvas.select( 'g.chart-holder' )
                        .selectAll( 'rect.bar' ).data( scope.values );

            bars.attr( 'class', 'bar' )
                .transition()
                .duration( 800 )
                .attr( 'x', function ( d, i ) {
                    return x( scope.seriesLabels[ i ] );
                } )
                .attr( 'y', function ( d ) {
                    return y( d );
                } )
                .attr( 'height', function ( d ) {
                    return height - y( d );
                } )
                .attr( 'width', x.rangeBand() )
                .attr( 'opacity', 0.75 );

            bars.enter()
                .append( 'rect' )
                .attr( 'class', 'bar' )
                .attr( 'fill', function ( d, i ) {
                    return scope.colorGenerator( { $pos: i } );
                } )
                .transition()
                .duration( 800 )
                .attr( 'x', function ( d, i ) {
                    return x( scope.seriesLabels[ i ] );
                } )
                .attr( 'y', function ( d ) {
                    return y( d );
                } )
                .attr( 'height', function ( d ) {
                    return height - y( d );
                } )
                .attr( 'width', x.rangeBand() )
                .attr( 'opacity', 0.75 );

            bars.exit()
                .transition()
                .attr( 'width', function () { return 0; } )
                .remove();

            bars.on( 'mouseover', function () {
                tip.show.apply( this, arguments );
            } )
            .on( 'mouseout', function () {
               tip.hide.apply( this, arguments );
            } );
        };

        postLink = function ( scope, element ) {

            var parent = $( element ).parent(),
                win = $( window ), tip,
                svg, graphCanvas, resizeWait;

            svg = d3.select( element[ 0 ] ).attr( 'class', 'histogram' );

            graphCanvas = svg.append( 'g' );

            tip = d3.tip()
                    .attr( 'class', 'd3-tip' )
                    .offset( [ -10, 0 ] )
                    .html( function ( d, i ) {
                        return scope.tooltipFormatter( {
                            $val: d,
                            $pos: i
                        } );
                    } );

            svg.call( tip );

            graphCanvas.append( 'g' ).attr( 'class', 'axis x-axis' );
            graphCanvas.append( 'g' ).attr( 'class', 'axis y-axis' );
            graphCanvas.append( 'g' ).attr( 'class', 'chart-holder' );

            if ( parent.is( ':visible' ) ) {
                renderChart( scope, element, tip );
            }

            scope.$watch( function () {
                return parent.is( ':visible' );
            }, function ( val ) {
                if ( val ) {
                    renderChart( scope, element, tip );
                }
            } );

            win.on( 'resize.histogram_' + scope.$id, function () {
                var isVisible = parent.is( ':Visible' );
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
                win.off( 'resize.histogram_' + scope.$id );
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
                seriesLabels: '=',
                lastUpdate: '=',
                colorGenerator: '&',
                tooltipFormatter: '&'
            }
        };
    } ] );
