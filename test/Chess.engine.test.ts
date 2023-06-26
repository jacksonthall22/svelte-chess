// Tests for the engine glue part of the Chess component.
// Very slow since the engine is loaded many times.

import Chess from '../src/lib/Chess.svelte';
import type { Move } from '../src/lib/Chess.svelte';
import { Engine } from '../src/lib/engine.js';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import '@vitest/web-worker';

describe("playEngineMove", async () => {
	test( "playEngineMove() plays an engine move", async () => {
		const engine = new Engine({
			stockfishPath: 'static/stockfish.js',
			color: 'none',
			moveTime: 50,
		});
		const { component } = render( Chess, { props: { engine } } );
		component.$on( 'ready', () => {component.playEngineMove()} );
		await waitFor( () => expect( component.getHistory() ).toHaveLength(1), { timeout: 10e3 } );
	}, 10e3 );
}, 15e3);

describe("Engine auto-plays moves", async () => {
	test( 'Auto-plays first and third half-moves as White', async () => {
		const engine = new Engine({
			stockfishPath: 'static/stockfish.js',
			color: 'w',
			moveTime: 50,
		});
		const { component } = render( Chess, { props: { engine } } );
		component.$on( 'move', (event) => {
			if ( component.getHistory().length == 1 ) {
				component.move('g6');
			}
		} );
		await waitFor( () => expect( component.getHistory() ).toHaveLength(3), { timeout: 10e3 } );
	});
	test( 'Auto-plays second and fourth half-moves as Black', async () => {
		const engine = new Engine({
			stockfishPath: 'static/stockfish.js',
			color: 'b',
			moveTime: 50,
		});
		const { component } = render( Chess, { props: { engine } } );
		component.$on( 'ready', () => component.move('g3') );
		component.$on( 'move', (event) => {
			if ( component.getHistory().length == 2 ) {
				component.move('Bg2');
			}
		} );
		await waitFor( () => expect( component.getHistory() ).toHaveLength(4), { timeout: 10e3 } );
	});
	test( 'Auto-plays no moves as color "none"', async () => {
		const engine = new Engine({
			stockfishPath: 'static/stockfish.js',
			color: 'none',
			moveTime: 50,
		});
		const { component } = render( Chess, { props: { engine } } );
		// Expect history.length == 0 after 5 seconds (which includes engine init)
		await expect(
			() =>  waitFor( () => expect( component.getHistory().length ).not.toEqual(0), { timeout: 5e3 } )
		).rejects.toThrow(/expected \+0 to/);
		// Play move
		component.move('e4');
		// Expect history.length == 1 after another second
		await expect(
			() =>  waitFor( () => expect( component.getHistory().length ).not.toEqual(1), { timeout: 1e3 } )
		).rejects.toThrow(/expected 1 to /);
	});
	test( 'Auto-plays properly as White when reset or position loaded', async () => {
		const engine = new Engine({
			stockfishPath: 'static/stockfish.js',
			color: 'w',
			moveTime: 50,
		});
		const { component } = render( Chess, { props: { engine } } );
		await waitFor( () => expect( component.getHistory() ).toHaveLength(1), { timeout: 10e3 } );

		component.reset();
		expect( component.getHistory() ).toHaveLength(0);
		await waitFor( () => expect( component.getHistory() ).toHaveLength(1), { timeout: 10e3 } );

		component.load('q3nr1k/4bppp/3p4/4nPP1/r2BP2P/Np2Q3/1P6/1K1R1B1R w - - 5 25');
		expect( component.getHistory() ).toHaveLength(0);
		await waitFor( () => expect( component.getHistory() ).toHaveLength(1), { timeout: 10e3 } );

		component.load('q3nr1k/4bppp/3p4/1B2nPP1/r2BP2P/Np2Q3/1P6/1K1R3R b - - 6 25');
		expect( component.getHistory() ).toHaveLength(0);
		await expect( // Expect history.length == 0 after another second
			() =>  waitFor( () => expect( component.getHistory().length ).not.toEqual(0), { timeout: 1e3 } )
		).rejects.toThrow(/expected \+0 to /);
	});
	test( 'Auto-plays properly as Black when reset or position loaded', async () => {
		const engine = new Engine({
			stockfishPath: 'static/stockfish.js',
			color: 'b',
			moveTime: 50,
		});
		const { component } = render( Chess, { props: { engine } } );
		// Expect history.length == 0 after 5 seconds (which includes engine init)
		await expect(
			() =>  waitFor( () => expect( component.getHistory().length ).not.toEqual(0), { timeout: 5e3 } )
		).rejects.toThrow(/expected \+0 to/);

		component.reset();
		await expect( // Expect history.length == 0 after another second
			() =>  waitFor( () => expect( component.getHistory().length ).not.toEqual(0), { timeout: 1e3 } )
		).rejects.toThrow(/expected \+0 to/);

		component.load('q3nr1k/4bppp/3p4/4nPP1/r2BP2P/Np2Q3/1P6/1K1R1B1R w - - 5 25');
		await expect( // Expect history.length == 0 after another second
			() =>  waitFor( () => expect( component.getHistory().length ).not.toEqual(0), { timeout: 1e3 } )
		).rejects.toThrow(/expected \+0 to/);

		component.load('q3nr1k/4bppp/3p4/1B2nPP1/r2BP2P/Np2Q3/1P6/1K1R3R b - - 6 25');
		expect( component.getHistory() ).toHaveLength(0);
		await waitFor( () => expect( component.getHistory() ).toHaveLength(1), { timeout: 10e3 } );
	});
	test.each( [
		'8/8/8/4k3/R7/5R2/8/1K6 w - - 0 1', // K+2R vs K
		'8/4b3/8/4k3/2K5/5b2/8/8 w - - 0 1', // K vs K+2B
	] )('engine-vs-engine game plays until mate (FEN %s)', async (fen) => {
		const engine = new Engine({
			stockfishPath: 'static/stockfish.js',
			color: 'both',
			moveTime: 100,
		});
		const { component } = render( Chess, { props: { fen, engine } } );
		// wait until mate
		await waitFor( () => expect( component.getHistory().slice(-1)[0].slice(-1) ).toEqual('#'), { timeout: 30e3 } );
	}, 30e3);
}, 120e3);



test.todo( "chessground interactions are disabled before engine is loaded" ); //const user = userEvent.setup();
test.todo( "chessground interactions are enabled after engine is loaded" );
test.todo( "chessground interactions are disabled while engine is searching" );
test.todo( "move()/chessground move do not throw if the engine was searching" );
test.todo( "move()/chessground move stop engine move search if the engine was searching" );
test.todo( "engine moves or does not move correctly after undo()" );
test.todo( "on:uci forwards UCI messages");
test.todo( "correct king is hilighted on check");
