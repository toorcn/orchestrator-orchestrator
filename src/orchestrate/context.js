export function createContextManager({ historySize = 10 } = {}) {
  const history = [];

  const addTurn = (prompt) => {
    history.push(prompt);
    if (history.length > historySize) history.shift();
  };

  const bundle = () => history.slice();

  return { addTurn, bundle };
}
