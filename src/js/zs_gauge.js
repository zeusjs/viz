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
 *  @name zeus.viz.directive:zsGauge
 *  @restrict E
 *
 *  @description
 *  A directive for rendering a gauge with a needle
 *
 *  @scope
 *
 *  @param {number} value Current value to be indicated by gauge
 *  @param {number} maxValue Max possible value
 *  @param {string=} backColor The color of unfilled portion of the gauge
 *  @param {string=} fillColor The color of filled portion of the gauge
 *
 *  @example
 <example module="zeus.viz">
    <file name="index.html">
        <div ng-controller="myCtrl" style="width:350px;height:300px">
            <zs-gauge max-value="total"
                value="val"
                back-color="#CCC" fill-color="#ff9800">
            </zs-gauge>
        </div>
    </file>
    <file name="myCtrl.js">
        angular.module( 'zeus.viz' ).controller( 'myCtrl', function ( $scope, $interval ) {
            var cols = [ '#ff9800', '#8bc34a', '#e91e63', '#03a9f4'  ],
                stop;

            $scope.val = Math.random() * 1000;
            $scope.total = 1000;

            stop = $interval( function () {
                $scope.val = Math.random() * 1000;
            }, 5000 );

            $scope.$on( '$destroy', function () {
                $interval.cancel( stop );
            } );
        } );
    </file>
 </example>
 */

angular.module( 'zeus.viz' )
  .directive( 'zsGauge', [ '$window', function ( $window ) {
    var CHART_INSET = 10,
        postlink, renderGauge;

    postlink = function ( scope, elem ) {

        var execResize = false,
            win = $( $window ),
            svg, graphCanvas, backgroundArc,
            foregroundArc, needle;

            svg = d3.select( elem[ 0 ] ).
                    attr( 'class', 'zs-gauge' );

            graphCanvas = svg.append( 'g' ).
                            attr( 'class', 'gauge-block' );

            backgroundArc = graphCanvas.append( 'path' ).
                                attr( 'class', 'background-arc' );

            foregroundArc = graphCanvas.append( 'path' ).
                                attr( 'class', 'foreground-arc' );

            needle = graphCanvas.append( 'path' ).
                            attr( 'class', 'gauge-needle' );

            renderGauge( scope, elem, svg );

            win.bind( 'resize.' + scope.$id, function () {
                console.log( 'resize event triggerd for ' + scope.$id );
                if ( execResize !== false ) {
                    clearTimeout( execResize );
                }
                execResize = setTimeout( function () {
                    if ( $( elem ).is( ':visible' ) ) {
                        renderGauge( scope, elem, svg );
                        scope.$apply();
                    }
                }, 300 );
            } );

            scope.$on( '$destroy', function () {
                win.off( 'resize.' + scope.$id );
            } );

            scope.$watch( function () {
                return $( elem ).is( ':visible' );
            }, function ( val, old ) {
                if ( !old ) {
                    renderGauge( scope, elem, svg );
                }
            } );
    };

    renderGauge = function ( scope, elem, svg ) {

        svg.attr( 'width', 0 ).
            attr( 'height', 0 );

        var margin = {
                top: 10,
                right: 10,
                bottom: 10,
                left: 10
            },
            parent = elem[ 0 ].parentElement,
            oldNeedlePosition = 0,
            width = parent.clientWidth - margin.left - margin.right,
            height = parent.clientHeight - margin.top,
            radius = Math.min( width / 2, height ),
            gaugeWidth = width / 6,
            arc, valueScale, valueDegScale,
            gaugeBlock, needle, needlePosition, arcFilled;

        valueScale = d3.scale.linear().
                            domain( [ 0, 1 ] ).
                            range( [ -1.56, 1.56 ] );

        valueDegScale = d3.scale.linear().
                                domain( [ 0, 1 ] ).
                                range( [ 90, 270 ] );

        needlePosition = valueDegScale( 0 );

        svg.attr( 'width', width ).
            attr( 'height', height );

        gaugeBlock = svg.select( 'g.gauge-block' ).
                        attr( 'transform', 'translate( ' +
                            ( ( width ) / 2 ) + ',' + ( height - ( margin.bottom / 2 ) ) + ' )' );

        arc = d3.svg.arc().
                innerRadius( radius - CHART_INSET - gaugeWidth ).
                outerRadius( radius - CHART_INSET ).
                startAngle( -Math.PI / 2 );

        gaugeBlock.select( 'path.background-arc' ).
            datum( { endAngle: 1.56 } ).
            style( 'fill', scope.backColor ).
            attr( 'd', arc );

        gaugeBlock.select( 'path.foreground-arc' ).
            datum( { endAngle: -1.56 } ).
            style( 'fill', scope.fillColor ).
            attr( 'd', arc );

        needle = gaugeBlock.select( 'path.gauge-needle' ).
                    attr( 'd', 'M 0 ' + ( radius - CHART_INSET ) +
                        ' L -3 0 C -3 -6, 3 -6, 3 0 Z' ).
                    style( 'fill', '#666' ).
                    attr( 'transform', 'rotate( ' + needlePosition + ' )' );


        oldNeedlePosition = needlePosition;

        scope.$watch( 'value', function () {
            arcFilled = scope.value / scope.maxValue;

            if ( arcFilled > 1 ) {
                arcFilled = 1;
                gaugeBlock.select( 'path.foreground-arc' ).
                    attr( 'class', 'cap-error' );
            } else if ( !arcFilled ) {
                arcFilled = 0;
            }

            gaugeBlock.select( 'path.foreground-arc' ).
                transition().
                duration( 1500 ).
                ease( 'bounce' ).
                call( arcTween, valueScale( arcFilled ) );

            needle.transition().
                duration( 1500 ).
                ease( 'bounce' ).
                attrTween( 'transform', needleTween ).
                each( 'end', function () {
                    oldNeedlePosition = valueDegScale( arcFilled );
                } );

        } );

        function arcTween ( transition, newAngle ) {
                transition.attrTween( 'd', function ( d ) {
                    var interpolate = d3.interpolate( d.endAngle, newAngle );
                    return function ( t ) {
                        d.endAngle = interpolate( t );
                        return arc( d );
                    };
                } );
            }

        function needleTween () {
            return d3.interpolateString( 'rotate( ' + oldNeedlePosition + ' )',
                     'rotate( ' + valueDegScale( arcFilled ) + ' )' );
        }
    };

    return {
        restrict: 'E',
        templateNamespace: 'svg',
        template: '<svg></svg>',
        replace: true,
        scope: {
            initialValue: '@',
            maxValue: '=',
            value: '=',
            backColor: '@',
            fillColor: '@',
            needleColor: '@'
        },
        link: postlink
    };

} ] );
