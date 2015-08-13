'use strict';

xdescribe( 'Directive: zsDonut', function () {

    // load the directive's module
    beforeEach( module( 'zeus.viz' ) );
    // beforeEach( module( 'templates/directives/zs_donut.html' ) );

    var element,
        scope, domStr, svgEl, pathEl, circleEl, tooltipEl;

    describe( 'Percentage-based rendering', function () {

        beforeEach( inject( function ( $rootScope, $compile ) {
            scope = $rootScope.$new();
            scope.perc = 80;
            domStr = __html__[ 'test/mock_views/donut_percentage.html' ];
            element = angular.element( domStr );
            element = $compile( element )( scope );

            scope.$digest();

            svgEl = element.find( 'svg' );
            pathEl = svgEl.find( 'path' );
            circleEl = svgEl.find( 'circle' );

        } ) );

        it( 'should have exactly one path', function () {
            expect( svgEl.length ).toBe( 1 );
            expect( pathEl.length ).toBe( 1 );
            expect( circleEl.length ).toBe( 1 );
        } );

        it( 'should have radius 0.8 times the size of parent', function () {
            expect( circleEl.attr( 'r' ) ).toBe( '400' );
            expect( pathEl.eq( 0 ).attr( 'd' ) ).toMatch( /M\s*0,\s*\-400\s+A\s*400,\s*400.+/ );
        } );
    } );

    describe( 'Absolute value based rendering', function () {

        beforeEach( inject( function ( $rootScope, $compile ) {
            scope = $rootScope.$new();
            scope.val = [
                { label: 'This is test data', value: 80 },
                { label: 'This is test data', value: 10 },
                { label: 'This is sample data', value: 45 },
                { label: 'This is dummy data', value: 70 },
                { label: 'This is dummy data', value: 25 }
            ];
            scope.total = 250;
            domStr = __html__[ 'test/mock_views/donut_values.html' ];
            element = angular.element( domStr );
            element = $compile( element )( scope );

            scope.$digest();

            svgEl = element.find( 'svg' );
            pathEl = svgEl.find( 'path' );
            circleEl = svgEl.find( 'circle' );
            tooltipEl = element.find( '.zs-donut-tooltip' );

        } ) );

        it( 'should have exactly 5 paths', function () {
            expect( svgEl.length ).toBe( 1 );
            expect( pathEl.length ).toBe( 5 );
            expect( circleEl.length ).toBe( 1 );
        } );

        it( 'should have radius 0.8 times the size of parent', function () {
            expect( circleEl.attr( 'r' ) ).toBe( '400' );
            expect( pathEl.eq( 0 ).attr( 'd' ) ).toMatch( /M\s*361\.\d+,\s*170\.\d+\s+A\s*400,\s*400.+/ );
        } );

        it( 'should show proper tooltip', function () {
            pathEl.eq( 0 ).trigger( 'mouseenter' );
            expect( tooltipEl.css( 'display' ) ).toBe( 'block' );
            pathEl.eq( 0 ).trigger( 'mouseleave' );
            expect( tooltipEl.css( 'display' ) ).toBe( 'none' );
        } );
    } );
} );
