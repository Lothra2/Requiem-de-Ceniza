// El panel de una pista (o página arrancada): el texto entra en el marco, en letra de libro, y el panel mide lo que el texto.
const { entrar } = require('./comun_pruebas.cjs');
(async () => {
  for (const vista of ['pc', 'movil']) {
    const { b, p, errs } = await entrar(vista, 'templario', 5);
    await p.evaluate(() => { const ui = window.__ui; ui.dialogoTexto = 'Una pastora. Los cuervos ya le sacaron los ojos. En la mano aprieta un trozo de tela de hábito, gris, de los que usan los penitentes del Refugio.'; ui.izq = 'pagina'; Object.assign(ui, { paginaN: 1, paginaTotal: 3, paginaTitulo: 'Los que cuelgan', paginaPanel: 'Pista' }); });
    await p.waitForTimeout(700); await p.screenshot({ path: `/tmp/requiem-pruebas/pista_${vista}.png` });
    console.log(vista, errs.slice(0, 2)); await b.close();
  }
})();
