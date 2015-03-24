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
 *  @name zeus.viz.directive:zsMultiColumnGraph
 *  @restrict E
 *
 *  @description
 *  A directive for a time based area polt
 *
 *  @scope
 *
 *  @param {Array.<Array<number>>} values Samples. Each subarray contains contains samples
 *  from all series for a given `x` value
 *
 *  @param {function($pos)=} tickFormatterY Callback function that accepts
 *  `position` of a data point and returns string
 *
 *  @param {function($pos)=} tickFormatterX Callback function that accepts
 *  `position` of a data point and returns string
 *
 *  @param {number=} leftMargin Optional left margin for text. Defaults to `80`
 *  @param {Object=} lastUpdate Can be used to refresh the graph
 *  @param {string=} mode whether graph is stacked or grouped. Grouped by default
 *  @param {function($series)} colorGenerator returns a hex color value for
 *  a particular series index
 *
 *  @param {function($val,$pos,$series,$samples)} tooltipFormatter returns html.
 *  Accepts ($samples, $pos) for stacked and ($val,$series) for grouped
 *  @param {string=} labelAxisY Label for Y axis
 *  @param {number=} clampY Clamp Y max value
 *
 *  @example
 <example module="zeus.viz">
    <file name="index.html">
        <div ng-controller="myCtrl" style="height: 350px">
            <div class="alert alert-info pull-left">
                Current mode is <b>{{ activity.graphMode }}</b>
            </div>
            <button class="btn btn-info pull-right" ng-click="changeMode()">
                Toggle mode
            </button>

            <div style="height: 300px">
            <zs-multi-column-graph
                color-generator="activity.colors($series)"
                left-margin="150"
                last-update="lastUpdate"
                values="activity.samples"
                mode="{{ activity.graphMode }}"
                tooltip-formatter="activity.tooltips($samples,$pos,$series,$val)"
                tick-formatter-x="activity.xTickFormatter($pos)"
                tick-formatter-y="activity.yTickFormatter($val)">
            </zs-multi-column-graph>
            </div>
        </div>
    </file>
    <file name="myCtrl.js">
        angular.module( 'zeus.viz' ).controller( 'myCtrl',
        function ( $scope ) {

            var colors = [ '#ff5722', '#8bc34a', '#ffc107', '#03a9f4',
                '#e91e63', '#009688' , '#ff9800' ],

                labels = [ 'Create', 'Rename', 'Reads', 'Writes', 'Deletes', 'List', 'Open' ];

            $scope.changeMode = function () {
                if ( $scope.activity.graphMode === 'stack' ) {
                    $scope.activity.graphMode = 'group'
                } else {
                    $scope.activity.graphMode = 'stack'
                }
            };

            $scope.activity = {
                samples: [ [ Math.random() * 10000, Math.random() * 10000,
                            Math.random() * 10000, Math.random() * 10000,
                            Math.random() * 10000 ],
                            [ Math.random() * 10000, Math.random() * 10000,
                            Math.random() * 10000, Math.random() * 10000,
                            Math.random() * 10000 ],
                            [ Math.random() * 10000, Math.random() * 10000,
                            Math.random() * 10000, Math.random() * 10000,
                            Math.random() * 10000 ],
                            [ Math.random() * 10000, Math.random() * 10000,
                            Math.random() * 10000, Math.random() * 10000,
                            Math.random() * 10000 ],
                            [ Math.random() * 10000, Math.random() * 10000,
                            Math.random() * 10000, Math.random() * 10000,
                            Math.random() * 10000 ] ],

                xTickFormatter: function ( pos ) {

                    return pos;
                },

                yTickFormatter: function ( val ) {
                    return val;
                },

                colors: function ( pos ) {
                    return colors[ pos ];
                },
                tooltips: function ( samples, pos, series, val ) {
                    var text = [],
                        i;

                    if ( !angular.isDefined( val ) ) {
                        for ( i = 0; i < samples.length; i++ ) {
                            text.push( labels[ i ] + ': ' + samples[ i ] );
                        }

                        return text.join( '<br/>' );
                    } else {
                        return labels[ series ] + ': ' + val;
                    }
                },

                graphMode: 'group',
                graphModeStack: 'stack'
            };

        } );
    </file>
 </example>
 **/
angular.module( 'zeus.viz' )
.directive( 'zsMultiColumnGraph', [ '$timeout', function ( $timeout ) {

        var concat = Array.prototype.concat, // Cache reference for fast access
            postLink, renderChart, makeStackedColmuns, makeGroupedColumns,
            wrapLabel,
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

        makeGroupedColumns = function ( scope, x, y, height, bars ) {
            var seriesCount = 0;
            seriesCount = scope.values[ 0 ].length;

            bars.attr( 'class', 'bar' ).
                transition().
                duration( 800 ).
                attr( 'fill', function ( d ) {
                    return scope.colorGenerator( { $series: d.z } );
                } ).
                attr( 'y', function ( d ) {
                    return y( d.y );
                } ).
                attr( 'x', function ( d ) {
                    return x( d.x ) + x.rangeBand() / seriesCount * d.z;
                } ).
                attr( 'width', function () { return x.rangeBand() / seriesCount; } ).
                attr( 'height', function ( d ) {
                    return height - y( d.y );
                } ).
                attr( 'opacity', 0.9 );

            bars.enter().
                append( 'rect' ).
                attr( 'class', 'bar' ).
                attr( 'fill', function ( d ) {
                    return scope.colorGenerator( { $series: d.z } );
                } ).
                transition().
                duration( 800 ).
                attr( 'y', function ( d ) {
                    return y( d.y );
                } ).
                attr( 'x', function ( d ) {
                    return x( d.x ) + x.rangeBand() / seriesCount * d.z;
                } ).
                attr( 'width', function () { return x.rangeBand() / seriesCount; } ).
                attr( 'height', function ( d ) {
                    return height - y( d.y );
                } ).
                attr( 'opacity', 0.9 );

            bars.exit().
                transition().
                attr( 'height', function () { return 0; } ).
                remove();
        };

        makeStackedColmuns = function ( scope, x, y, bars ) {
            bars.attr( 'class', 'bar' ).
                transition().
                duration( 800 ).
                attr( 'fill', function ( d ) {
                    return scope.colorGenerator( { $series: d.z } );
                } ).
                attr( 'y', function ( d ) {
                    return y( d.y0 + d.y );
                } ).
                attr( 'x', function ( d ) { return x( d.x ); } ).
                attr( 'width', function () { return x.rangeBand(); } ).
                attr( 'height', function ( d ) {
                    return y( d.y0 ) - y( d.y0 + d.y );
                } ).
                attr( 'opacity', 0.9 );

            bars.enter().
                append( 'rect' ).
                attr( 'class', 'bar' ).
                transition().
                duration( 800 ).
                attr( 'fill', function ( d ) {
                    return scope.colorGenerator( { $series: d.z } );
                } ).
                attr( 'y', function ( d ) {
                    return y( d.y0 + d.y );
                } ).
                attr( 'x', function ( d ) { return x( d.x ); } ).
                attr( 'width', function () { return x.rangeBand(); } ).
                attr( 'height', function ( d ) {
                    return y( d.y0 ) - y( d.y0 + d.y );
                } ).
                attr( 'opacity', 0.9 );

            bars.exit().
                transition().
                attr( 'height', function () { return 0; } ).
                remove();
        };

        renderChart = function ( scope, element, tip ) {

            // Early exit
            if ( !scope.values || !scope.values.length ) {
                return;
            }

            var parentEl = element[ 0 ].parentElement,
                leftMargin = +scope.leftMargin || margin.left,
                width, height,
                svg, graphCanvas,
                transformedData = [],
                seriesCount = 0,
                barsData,
                bars, x, y, xAxis, yAxis, i, j, vArr, yMax;

            svg = d3.select( element[ 0 ] );
            graphCanvas = svg.select( 'g' );


            svg.attr( 'width', 0 ).
                attr( 'height', 0 );

            width = parentEl.clientWidth - leftMargin - margin.right;
            height = parentEl.clientHeight - margin.top - margin.bottom;

            svg.attr( 'width', width + leftMargin + margin.right ).
                attr( 'height', height + margin.top + margin.bottom );

            seriesCount = scope.values[ 0 ].length;
            for ( i = 0; i < seriesCount; i++ ) {
                transformedData.push( [] );

            }


            for ( i = 0; i < scope.values.length; i++ ) {
                vArr = scope.values[ i ];
                for ( j = 0; j < vArr.length; j++ ) {
                    transformedData[ j ].push( {
                        x: i,
                        y: vArr[ j ],
                        z: j,
                        y0: 0
                    } );
                }

            }


            x = d3.scale.ordinal().
                rangeRoundBands( [ 0, width ], 0.33 ).
                domain( d3.range( scope.values.length ) );

            y = d3.scale.linear().range( [ height, 0 ] );


            if ( scope.mode === 'stack' ) {

                barsData = concat.apply( [], d3.layout.stack()( transformedData ) );

            } else {

                barsData = concat.apply( [], transformedData );
            }

            if ( scope.clampY ) {
                y.clamp( true ).domain( [ 0, scope.clampY ] );

            } else {

                yMax = d3.max( barsData, function ( d ) { return d.y0 + d.y; } );
                y.domain( [ 0, yMax ] );
            }

            xAxis = d3.svg.axis().scale( x ).orient( 'bottom' ).
                    tickFormat( function ( d ) {
                        return scope.tickFormatterX( { $pos: d } );
                    } ).
                    innerTickSize( -height );

            yAxis = d3.svg.axis().
                    scale( y ).orient( 'left' ).
                    tickFormat( function ( d ) {
                        return scope.tickFormatterY( { $val: d } );
                    } ).
                    innerTickSize( -width ).
                    tickPadding( 10 );


            graphCanvas.attr( 'transform', 'translate(' + leftMargin + ',' + margin.top + ')' );

            graphCanvas.select( 'g.x-axis' ).
                attr( 'transform', 'translate(0,' + height + ')' ).
                transition().
                duration( 800 ).
                call( xAxis ).
            selectAll( '.tick text' ).
                call( wrapLabel, x.rangeBand() );


            graphCanvas.select( 'g.y-axis' ).
                transition().
                duration( 800 ).
                call( yAxis );

            if ( scope.labelAxisY && !scope.renderAxixLable ) {
                graphCanvas.select( 'g.y-axis' )
                    .append( 'text' )
                    .attr( 'transform', 'rotate(-90)' )
                    .attr( 'y', 6 )
                    .attr( 'dy', '.71em' )
                    .style( 'text-anchor', 'end' )
                    .text( scope.labelAxisY );
                scope.renderAxixLable = true;
            }

            bars = graphCanvas.select( 'g.chart-holder' ).
                    selectAll( 'rect' ).data( barsData );

            if ( scope.mode === 'stack' ) {
                makeStackedColmuns( scope, x, y, bars );
            } else {
                makeGroupedColumns( scope, x, y, height, bars );
            }

            bars.on( 'mouseover', function () {
                    tip.show.apply( this, arguments );
                    $( this ).attr( 'opacity', 1 );
                } ).
                on( 'mouseout', function () {
                        tip.hide.apply( this, arguments );
                        $( this ).attr( 'opacity', 0.9 );
                } );

        };

        postLink = function ( scope, element, attrs ) {

            var parent = $( element ).parent(),
                win = $( window ),
                svg, graphCanvas, resizeWait, tip;

            scope.leftMargin = attrs.leftMargin;
            scope.renderAxixLable = false;
            scope.clampY = +attrs.clampY;

            svg = d3.select( element[ 0 ] ).attr( 'class', 'multi-column-graph' );
            console.log( svg, element );
            tip = d3.tip().
                    attr( 'class', 'd3-tip' ).
                    offset( [ -10, 0 ] ).
                    html( function ( d ) {
                        if ( scope.mode === 'stack' ) {
                            return scope.tooltipFormatter( {
                                $pos: d.x,
                                $samples: scope.values[ d.x ]
                            } );
                        } else {
                            return scope.tooltipFormatter( {
                                $series: d.z,
                                $pos: d.x,
                                $val: d.y
                            } );
                        }
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

            win.on( 'resize.multi_column_' + scope.$id, function () {
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
                win.off( 'resize.multi_column_' + scope.$id );
            } );

            scope.$watch( 'lastUpdate', function () {
                if ( parent.is( ':visible' ) ) {
                    renderChart( scope, element, tip );
                }
            } );

            scope.$watch( 'mode', function () {
                if ( parent.is( ':visible' ) ) {
                    renderChart( scope, element, tip );
                }
            } );
        };

        return {
            templateNamespace: 'svg',
            template: '<svg></svg>',
            replace: true,
            restrict: 'E',
            link: postLink,
            scope: {
                values: '=',
                tickFormatterX: '&',
                tickFormatterY: '&',
                lastUpdate: '=',
                colorGenerator: '&',
                tooltipFormatter: '&',
                mode: '@',
                labelAxisY: '@'
            }
        };

    }
] );
