# svelte-chess

Fully playable chess component for Svelte, combining chess.js and chessground.

![Svelte-chess screenshots](https://github.com/gtim/svelte-chess/blob/main/static/screenshot.png?raw=true)

## Features

* Track game state via bindable props
* Pawn promotion dialog
* Undo moves
* Fully restylable
* Move history
* Detailed events
* Typed

## Usage 

Installation:

    npm install svelte-chess

Basic playable chessboard ([REPL](https://svelte.dev/repl/b1a489538165489aa2720a65b476a58b?version=3.59.1)):

    <script>
        import {Chess} from 'svelte-chess';
    </script>    
    <Chess />

Interact with the game via [props](#props), [methods](#methods) or [events](#events).

## Props

Game state can be observed by binding to props. 

| Prop        | Bindable and readable | Writable | Value                                                                                |
| ----------- | :-------------------: | :------: | ------------------------------------------------------------------------------------ |
| `turn`      |           ✓           |          | Current color to move: `w` or `b`                                                    |
| `moveNumber`|           ✓           |          | Current move number (whole moves)                                                    |
| `history`   |           ✓           |          | Array of all moves as SAN strings, e.g. `['d4','Nf6']`                               |
| `isGameOver`|           ✓           |          | True if the game is over. Listen for the [gameOver event](#events) for more details. |
| `fen`       |           ✓           |    ✓     | Current position in [FEN](https://www.chessprogramming.org/Forsyth-Edwards_Notation) |
| `class` |                       |    ✓     | CSS class applied to children instead of default (see [Styling](#styling)).          |

All readable props are bindable and updated whenever the game state changes.
Writable props are only used when the component is created.

Example using bindable props to monitor state ([REPL](https://svelte.dev/repl/d0ec69dde1f84390ac8b4d5746db9505?version=3.59.1)):

    <script>
        import {Chess} from 'svelte-chess';
        let moveNumber, turn, history;
    </script>    
	<Chess bind:moveNumber bind:turn bind:history/>
    <p>
        It's move {moveNumber}, with {turn} to move.
        Moves played: {history?.join(' ')}.
    </p>

Starting from a specific FEN ([REPL](https://svelte.dev/repl/ebce18a71d774b2db987abc71f45648a?version=3.59.1)):

    <Chess fen="rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6" />

## Methods

The board state can be read and manipulated via method calls to the Chess component itself. 

Methods for reading game/board state:

* `getHistory()`: Same as the `history` prop. All moves played in the game, as an array of SAN strings, e.g. `['d4','Nf6','Bg5']`.
* `getHistory({verbose: true})`: All moves played in the game, as an array of [Move objects](#move).
* `getBoard()`: An 8x8 array of the current position. Each element is null (empty square) or an object on the form `{ square: 'd8', type: 'q', color: 'b' }`.

Methods for manipulating game/board state:

* `move( san )`: Make a move programmatically. Argument is the move in [short algebraic notation](https://en.wikipedia.org/wiki/Algebraic_notation_(chess)), e.g. `Nf3`. Throws an error if the move is illegal or malformed.
* `load( fen )`: Loads a position from FEN. Throws an error if the FEN could not be parsed.
* `reset()`: Resets the game to the initial position.
* `undo()`: Undoes the last move and returns it.
* `toggleOrientation()`: Flips the board.

Example implementing undo/reset buttons ([REPL](https://svelte.dev/repl/7dd7b6454b12466e90ac78a842151311?version=3.59.1)):

    <script>
        import {Chess} from 'svelte-chess';
        let chess;
    </script>    
    <Chess bind:this={chess}/>
    <button on:click={()=>chess?.reset()}>Reset</button>
    <button on:click={()=>chess?.undo()}>Undo</button>

## Events

A `move` event is dispatched after every move, containing the corresponding [Move object](#move).

A `gameOver` event is emitted after a move that ends the game. The GameOver object has two keys:
* `reason`: `checkmate`, `stalemate`, `repetition`, `insufficient material` or `fifty-move rule`.
* `result`: 1 for White win, 0 for Black win, or 0.5 for a draw.

Example listening for `move` and `gameOver` events ([REPL](https://svelte.dev/repl/6fc2874d1a594d76aede4834722e4f83?version=3.59.1)):

    <script>
        import {Chess} from 'svelte-chess';
        function moveListener(event) {
            const move = event.detail;
            console.log( `${move.color} played ${move.san}` );
        }
        function gameOverListener(event) {
            console.log( `The game ended due to ${event.detail.reason}` );
        }
    </script>
    <Chess on:move={moveListener} on:gameOver={gameOverListener} />

Svelte-chess exports the MoveEvent and GameOverEvent types.

## Styling

The stylesheet shipped with Chessground is used by default. To restyle the 
board, pass the `class` prop and import a stylesheet.

Example with custom stylesheet:

    <script>
        import { Chess } from 'svelte-chess';
    </script>
    <link rel="stylesheet" href="/my-style.css" />
    <Chess class="my-class" />

A sample stylesheet can be found in [/static/style-paper.css](https://github.com/gtim/svelte-chess/blob/main/static/style-paper.css).

## Types

### Move

A `Move` describes a chess move. It is identical to the chess.js Move type. Properties:
  - `color`: `w` for White move or `b` for Black move.
  - `from` and `to`: Origin and destination squares, e.g. `g1` and `f3`.
  - `piece`: Piece symbol, one of `pnbrqk` (pawn, knight, bishop, rook, queen, king).
  - `captured` and `promotion`: Piece symbol of a capture or promotion, if applicable.
  - `san`: Standard algebraic notation, e.g. `Nf3`.
  - `lan`: Long algebraic notation, e.g. `g1f3`.
  - `before` and `after`: FEN of positions before and after the move.
  - `flags`: String of letters for each flag that applies to the move: `c` for standard capture, `e` for en passant capture, `n` for non-capture, `b` for two-square pawn move, `p` for promotion, `k` for kingside castling and `q` for queenside castling.


## Future

Bugs:

* Promotion dialog misplaced when the board is flipped

Not yet implemented features:

* Programmatically draw arrows/circles on the board
* orientation prop
* inCheck prop
* Stockfish?
