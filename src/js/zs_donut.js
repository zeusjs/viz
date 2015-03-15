'use strict';

/**
 *  @ngdoc directive
 *  @name zeus.viz.directive:zsDonut
 *  @restrict E
 *
 *  @description
 *  A directive for rendering single valued( percentage based ) donuts as well as
 *  multi series donut
 *
 *  @scope
 *
 *  @param {number} percentage Percentage
 *  @param {Array.<object>} values Values as array of objects {label: 'tooltip text', value: 100}
 *  @param {function($val,$index)=} segmentColor Callback function that accepts
 *  `value` and `index` of a segment and returns its hex color as `string`
 *  @param {string=} title Title
 *  @param {string=} subtitle Subtitle
 *
 *  @example
 <example module="zeus.viz">
    <file name="index.html">
        <div ng-controller="myCtrl">
            <zs-donut values="val" text="45"
                subtitle="people" segment-color="paints($index)">
            </zs-donut>
        </div>
    </file>
    <file name="myCtrl.js">
        angular.module( 'zeus.viz' ).controller( 'myCtrl', function ( $scope ) {
            var cols = [ '#ff9800', '#8bc34a', '#e91e63', '#03a9f4'  ];
            $scope.perc = 99.999999;

            $scope.val = [
                { label: 'This is test data', value: 10 },
                { label: 'This is test data', value: 20 },
                { label: 'This is sample data', value: 30 },
                { label: 'This is dummy data', value: 40 }
            ];

            $scope.paints = function ( idx ) {
                return cols[ idx ];
            }
        } );
    </file>
 </example>
 */

angular.module( 'zeus.viz' )
    .directive( 'zsDonut', [ '$timeout',
        function ( $timeout ) {

        var postLink, renderChart;

        renderChart = function ( scope, element, svg, tip ) {

            // Early exit
            if ( !scope.values || !scope.values.length ) {
                return;
            }

            svg.attr( 'width', 0 ).
                attr( 'height', 0 );

            var parent = element[ 0 ].parentElement,
                width = parent.clientWidth - 20,
                height = parent.clientHeight - 20,
                legendHeight = scope.showLegend ? 20 : 0,
                bottomPadding = scope.showLegend ? 10 : 0,
                radius, arc, pie, arcTween,
                labelOffset = [],
                legendRightExtent = 0,
                cx, cy,
                donut, legendLabels, donutFragment, legendFragment, title;


            if ( 0.5 * width > height ) {
                height = 0.5 * width + legendHeight + bottomPadding;
            }


            svg.attr( 'width', width ).
                attr( 'height', height );

            radius = Math.min( width, height - legendHeight - bottomPadding ) / 2;

            cx = Math.max( width, radius * 2 ) / 2;
            cy = Math.max( height - legendHeight - bottomPadding, radius * 2 ) / 2;

            donutFragment = svg.select( 'g.donut-fragment' ).
                attr( 'transform', 'translate(' + cx + ',' + cy + ')' );

            title = scope.title;

            donutFragment.select( 'text.donut-title' ).
                attr( 'x', 0 ).
                attr( 'y', 0 ).
                style( 'font-size', radius / 2 + 'px' ).
                text( title );

            donutFragment.select( 'text.donut-subtitle' ).
                attr( 'x', 0 ).
                attr( 'y', radius / 4 ).
                style( 'font-size', radius / 6 + 'px' ).
                text( scope.subtitle );


            legendFragment = svg.select( 'g g.legend-fragment' );

            arc = d3.svg.arc()
                    .outerRadius( radius * 0.95 )
                    .innerRadius( radius * 0.75 );


            arcTween = function ( a ) {
                var i = d3.interpolate( this._current, a );
                this._current = i( 0 );

                return function ( t ) {
                    return arc( i( t ) );
                };
            };

            pie = d3.layout.pie().
                    sort( null ).
                    value( function ( d ) { return d.value; } );


            donut = donutFragment.selectAll( 'path' ).
                    data( pie( scope.values ) );


            donut.attr( 'fill', function ( d, i ) {
                    return scope.segmentColor( { $val: d.data, $index: i } );

                } ).
                each( function ( d ) {
                    this._current = {
                        startAngle: d.startAngle,
                        endAngle: d.startAngle,
                        value: 0
                    };
                } ).
                transition().
                duration( 800 ).
                attrTween( 'd', arcTween );

            donut.enter().append( 'path' ).
                attr( 'fill', function ( d, i ) {
                    return scope.segmentColor( { $val: d.data, $index: i } );

                } ).
                each( function ( d ) {
                    this._current = {
                        startAngle: d.startAngle,
                        endAngle: d.startAngle,
                        value: 0
                    };
                } ).
                transition().
                duration( 800 ).
                attrTween( 'd', arcTween );


            donut.exit().
                each( function ( d ) {
                    d.startAngle = 2 * Math.PI - 0.001;
                    d.endAngle = 2 * Math.PI;
                } ).
                transition().
                duration( 800 ).
                attrTween( 'd', arcTween ).
                remove();


            donut.on( 'mouseover', tip.show ).
            on( 'mouseout', tip.hide );


            if ( scope.showLegend ) {

                legendFragment.selectAll( 'g.legend-label text' ).remove();
                legendFragment.selectAll( 'g.legend-label circle' ).remove();

                legendLabels = legendFragment.selectAll( 'g.legend-label' ).
                    data( scope.values );

                legendLabels.enter().
                    append( 'g' ).
                    attr( 'class', 'legend-label' ).
                    attr( 'transform', function ( d, i ) {
                        return 'translate(' + ( ( width / scope.values.length ) * i ) + ', 0)';
                    } );

                legendLabels.
                    attr( 'transform', function ( d, i ) {
                        return 'translate(' + ( ( width / scope.values.length ) * i ) + ', 0)';
                    } );

                legendLabels.exit().remove();


                legendLabels = legendFragment.selectAll( 'g.legend-label' );
                window.legendLabels = legendLabels;

                legendLabels.append( 'circle' ).
                        attr( 'cx', '8' ).
                        attr( 'cy', '8' ).
                        attr( 'r', '5' ).
                        attr( 'fill', function ( d, i ) {
                            return scope.segmentColor( { $val: d, $index: i } );

                        } );

                legendLabels.append( 'text' ).
                        attr( 'x', '17' ).
                        text( function ( d ) {
                            return d.label;
                        } ).
                        attr( 'y', function ( d, i ) {
                            var size = this.getComputedTextLength(),
                                offset = 30 + size;
                            if ( i === 0 ) {
                                labelOffset.push( offset );
                            } else {
                                labelOffset.push( labelOffset[ i - 1 ] + offset );
                            }

                            return 8;
                        } ).
                        attr( 'dy', 5 ).
                        attr( 'text-anchor', 'start' );

                legendLabels.attr( 'transform', function ( d, i ) {
                    if ( i === 0 ) {
                        return 'translate(0, 0)';
                    } else {
                        return 'translate(' + labelOffset[ i -  1 ] + ', 0)';
                    }
                } );

                legendRightExtent = labelOffset[ labelOffset.length - 1 ];

                legendFragment.
                    attr( 'transform', 'translate(' + ( ( width - legendRightExtent ) / 2 ) +
                    ',' + ( height - legendHeight ) + ')' );
            } else {
                legendLabels = legendFragment.selectAll( 'g.legend-label' ).
                    remove();
            }
        };

        postLink = function ( scope, element, attrs ) {

            var parent = $( element ).parent(),
                win = $( window ),
                svg, graphCanvas, donut, resizeWait, tip;

            scope.showLegend = !!attrs.showLegend;

            svg = d3.select( element[ 0 ] ).
                    attr( 'class', 'zs-donut' );

            tip = d3.tip().
                    attr( 'class', 'd3-tip' ).
                    html( function ( d ) {
                        return d.data.label + ': ' + d.data.value;
                    } );

            svg.call( tip );

            graphCanvas = svg.append( 'g' );

            donut = graphCanvas.append( 'g' )
                .attr( 'class', 'donut-fragment' );

            donut.append( 'text' ).
                attr( 'class', 'donut-title' ).
                attr( 'text-anchor', 'middle' );

            donut.append( 'text' ).
                attr( 'class', 'donut-subtitle' ).
                attr( 'text-anchor', 'middle' );

            graphCanvas.append( 'g' ).attr( 'class', 'legend-fragment' );

            if ( parent.is( ':visible' ) ) {
                renderChart( scope, element, svg, tip );
            }

            scope.$watch( function () {
                var isVisible = parent.is( ':visible' );
                return isVisible;
            }, function () {
                if ( parent.is( ':visible' ) ) {
                    renderChart( scope, element, svg, tip );
                }
            } );

            win.on( 'resize.donut_' + scope.$id, function () {
                var isVisible = parent.is( ':visible' );
                if ( resizeWait ) {
                    $timeout.cancel( resizeWait );
                }

                if ( !isVisible ) {
                    return;
                }
                resizeWait = $timeout( function () {
                    renderChart( scope, element, svg, tip );
                }, 500 );
            } );

            scope.$on( '$destroy', function () {
                win.off( 'resize.donut_' + scope.$id );
            } );

            scope.$watch( 'lastUpdate', function () {
                if ( parent.is( ':visible' ) ) {
                    renderChart( scope, element, svg, tip );
                }
            } );
        };

        return {
            templateNamespace: 'svg',
            template: '<svg></svg>',
            replace: true,
            restrict: 'E',
            scope: {
                percentage: '=?',
                segmentColor: '&',
                values: '=?',
                total: '=?',
                title: '@text',
                subtitle: '@',
                lastUpdate: '=?'
            },
            link: postLink
        };
    }
] );
