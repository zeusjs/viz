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
 *  @name zeus.viz.directive:zsPunchCard
 *  @restrict E
 *
 *  @description
 *  A directive for a time based area polt
 *
 *  @scope
 *
 *  @param {Array.<number>} values Values as array of numbers
 *  @param {function($val,$pos)=} tickFormatterY Callback function that accepts
 *  `value` and `position` of a data point and returns string
 *  @param {string=} dateFormat Optional date format string
 *
 *  @example
 <example module="zeus.viz">
    <file name="index.html">
        <div ng-controller="myCtrl" style="height:400px;">
            <zs-punch-card punch-data="activityData"
                tick-formatter-y="tickFormatter($val)"
                tick-formatter-x="xTickFormatter($pos)"
                punch-color="punchColor($pos)"
                last-update="lastUpdate"
                tooltip-formatter="tooltips($val,$pos)">
            </zs-punch-card>
        </div>
    </file>
    <file name="myCtrl.js">
        angular.module( 'zeus.viz' ).controller( 'myCtrl',
        function ( $scope, $interval ) {

            var OPERATIONS = [ 'Reads', 'Writes', 'Delete', 'Create', 'List' ],
                stop;

            $scope.activityData = [
                {
                    samples: [
                        Math.random(), Math.random(), Math.random(), Math.random(),
                        Math.random(), Math.random(), Math.random(), Math.random(),
                        Math.random(), Math.random(), Math.random(), Math.random(),
                    ]
                },
                {
                    samples: [
                        Math.random(), Math.random(), Math.random(), Math.random(),
                        Math.random(), Math.random(), Math.random(), Math.random(),
                        Math.random(), Math.random(), Math.random(), Math.random(),
                    ]
                },
                {
                    samples: [
                        Math.random(), Math.random(), Math.random(), Math.random(),
                        Math.random(), Math.random(), Math.random(), Math.random(),
                        Math.random(), Math.random(), Math.random(), Math.random(),
                    ]
                },
                {
                    samples: [
                        Math.random(), Math.random(), Math.random(), Math.random(),
                        Math.random(), Math.random(), Math.random(), Math.random(),
                        Math.random(), Math.random(), Math.random(), Math.random(),
                    ]
                },
                {
                    samples: [
                        Math.random(), Math.random(), Math.random(), Math.random(),
                        Math.random(), Math.random(), Math.random(), Math.random(),
                        Math.random(), Math.random(), Math.random(), Math.random(),
                    ]
                }
            ];
            $scope.tickFormatter = function ( v ) {
                return OPERATIONS[ v ];
            };

            $scope.punchColor = function ( pos ) {
                var colors = [ '#ff5722', '#8bc34a', '#ffc107', '#03a9f4', '#e91e63' ];

                return colors[ pos[ 0 ] ];
            };


            $scope.xTickFormatter = function ( v ) {
                return '' + v[ 1 ];
            };

            $scope.tooltips = function ( val, pos ) {
                return OPERATIONS[ pos[ 0 ] ]+ ': ' + val;
            };

            stop = $interval( function () {
                $scope.activityData = [
                    {
                        samples: [
                            Math.random(), Math.random(), Math.random(), Math.random(),
                            Math.random(), Math.random(), Math.random(), Math.random(),
                            Math.random(), Math.random(), Math.random(), Math.random(),
                        ]
                    },
                    {
                        samples: [
                            Math.random(), Math.random(), Math.random(), Math.random(),
                            Math.random(), Math.random(), Math.random(), Math.random(),
                            Math.random(), Math.random(), Math.random(), Math.random(),
                        ]
                    },
                    {
                        samples: [
                            Math.random(), Math.random(), Math.random(), Math.random(),
                            Math.random(), Math.random(), Math.random(), Math.random(),
                            Math.random(), Math.random(), Math.random(), Math.random(),
                        ]
                    },
                    {
                        samples: [
                            Math.random(), Math.random(), Math.random(), Math.random(),
                            Math.random(), Math.random(), Math.random(), Math.random(),
                            Math.random(), Math.random(), Math.random(), Math.random(),
                        ]
                    },
                    {
                        samples: [
                            Math.random(), Math.random(), Math.random(), Math.random(),
                            Math.random(), Math.random(), Math.random(), Math.random(),
                            Math.random(), Math.random(), Math.random(), Math.random(),
                        ]
                    }
                ];
                $scope.lastUpdate = ( new Date() ).getTime();
            }, 4000 );

            $scope.$on( '$destroy', function () {
                $interval.cancel( stop );
            } );

        } );
    </file>
 </example>
 **/

angular.module( 'zeus.viz' )
.directive( 'zsPunchCard', [ '$timeout', function ( $timeout ) {
        var PADDING = 30,
            LEFT_PADDING = 85,
            BOTTOM_PADDING = 30,
            RIGHT_PADDING = 20,
            postLink, repaint;

        repaint = function ( scope, element, tip ) {

            // Early exit
            if ( !scope.punchData || !scope.punchData.length ) {
                return;
            }

            var parentEl = element[ 0 ].parentElement,
                width, height,
                svg,
                aggregateData = [],
                leftMargin = +scope.leftMargin || LEFT_PADDING,
                samplesLen = scope.punchData[ 0 ].samples.length,
                x, y, xAxis, yAxis, maxR, maxRadius, radiusFn, dots;

            svg = d3.select( element[ 0 ] );

            svg.attr( 'width', 0 ).attr( 'height', 0 );

            width = parentEl.clientWidth;
            height = parentEl.clientHeight;


            maxRadius = Math.min( ( width - PADDING -
                leftMargin - RIGHT_PADDING ) / samplesLen - 2, 12 );

            svg.attr( 'width', width ).
                attr( 'height', height );


            // massage data
            aggregateData = [];
            maxR = 0;
            angular.forEach( scope.punchData, function ( punches, pos ) {
                aggregateData = aggregateData.concat( punches.samples.map( function ( s, i ) {
                        if ( s > maxR ) {
                            maxR = s;
                        }
                        return {
                            punchPosition: [ pos, i ],
                            value: s
                        };

                } ) );

            } );

            x = d3.scale.linear().
                domain( [ 0, samplesLen - 1 ] ).
                rangeRound( [ leftMargin, width - PADDING - RIGHT_PADDING ] );

             xAxis = d3.svg.axis().scale( x ).
                orient( 'bottom' ).ticks( samplesLen ).
                tickFormat( function ( v, i ) {
                    var t = aggregateData[ i ].punchPosition;
                    return scope.tickFormatterX( { $pos: t } );

                } );

            y = d3.scale.ordinal().
                    domain( scope.punchData.map( function ( d, i ) {
                        return i;
                    } ) ).
                    rangePoints( [ PADDING, height - PADDING * 2 - BOTTOM_PADDING ], 0, 1 );

            yAxis = d3.svg.axis().scale( y ).
                orient( 'left' ).
                tickFormat( function ( i, v ) {
                    return scope.tickFormatterY( { $val: v, $pos: i } );
                } );

            svg.select( 'g.x-axis' )
                .attr( 'class', 'axis x-axis' )
                .attr( 'transform', 'translate(0, ' + ( height - PADDING - BOTTOM_PADDING ) + ')' )
                .call( xAxis );

            svg.select( 'g.y-axis' ).
                attr( 'transform', 'translate(' +
                    ( leftMargin - PADDING ) + ', -' + 0 + ')' ).
                call( yAxis );

            radiusFn = d3.scale.linear().
                    domain( [ 0, maxR ] ).
                    range( [ 0, maxRadius ] );


            dots = svg.selectAll( 'circle' ).data( aggregateData );

            dots.exit().
                transition().
                attr( 'r', function () { return '0'; } ).
                remove();

            dots.attr( 'class', 'punch-dot' ).
                transition().
                duration( 800 ).
                attr( 'cx', function ( d ) {
                    return x( d.punchPosition[ 1 ] );

                } ).
                attr( 'cy', function ( d ) {
                    return y( d.punchPosition[ 0 ] );
                } ).
                attr( 'fill', function ( d ) {
                    return scope.punchColor( { $pos: d.punchPosition } );
                } ).
                attr( 'r', function ( d ) {
                    var r = radiusFn( d.value );
                    return r;
                } );

            dots.enter().
                append( 'circle' ).
                attr( 'class', 'punch-dot' ).
                attr( 'cx', function ( d ) {
                    return x( d.punchPosition[ 1 ] );
                } ).
                attr( 'cy', function ( d ) {
                    return y( d.punchPosition[ 0 ] );
                } ).
                attr( 'fill', function ( d ) {
                    return scope.punchColor( { $pos: d.punchPosition } );
                } ).
                transition().
                duration( 800 ).
                attr( 'r', function ( d ) {
                    var r = radiusFn( d.value );
                    return r;
                } );


            dots.on( 'mouseover', tip.show )
                .on( 'mouseout', tip.hide );


        };

        postLink = function ( scope, element, attrs ) {

            var parent = $( element ).parent(),
                win = $( window ),
                resizeWait,
                svg, tip;

            scope.leftMargin = attrs.leftMargin;

            svg = d3.select( element[ 0 ] ).attr( 'class', 'punch-card' );

            svg.append( 'g' ).
                attr( 'class', 'axis y-axis' );

            svg.append( 'g' ).
                attr( 'class', 'axis x-axis' );

            tip = d3.tip().
                    attr( 'class', 'd3-tip' ).
                    offset( [ -10, 0 ] ).
                    html( function ( d ) {
                        return scope.tooltipFormatter( {
                            $val: d.value,
                            $pos: d.punchPosition
                        } );
                    } );


            svg.call( tip );

            if ( parent.is( ':visible' ) ) {
                repaint( scope, element, tip );
            }

            scope.$watch( function () {
                var isVisible = parent.is( ':visible' );
                return isVisible;
            }, function () {
                if ( parent.is( ':visible' ) ) {
                    repaint( scope, element, tip );
                }
            } );

            win.on( 'resize.punch_card_' + scope.$id, function () {
                var isVisible = parent.is( ':visible' );
                if ( resizeWait ) {
                    $timeout.cancel( resizeWait );
                }

                if ( !isVisible ) {
                    return;
                }
                resizeWait = $timeout( function () {
                    repaint( scope, element, tip );
                }, 500 );
            } );

            scope.$on( '$destroy', function () {
                win.off( 'resize.punch_card_' + scope.$id );
            } );

            scope.$watch( 'lastUpdate', function () {

                if ( parent.is( ':visible' ) ) {
                    repaint( scope, element, tip );
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
                punchData: '=',
                tickFormatterY: '&',
                tickFormatterX: '&',
                punchColor: '&',
                lastUpdate: '=',
                tooltipFormatter: '&'
            }
        };
    }
] );
