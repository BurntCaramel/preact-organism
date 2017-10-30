import { render, h } from 'preact'
import CounterOrganism from './organisms/Counter'

render((
	<div id="foo">
		<span>Hello, world!</span>
		<button onClick={ e => alert("hi!") }>Click Me</button>
		<CounterOrganism />
	</div>
), document.getElementById('app'))
