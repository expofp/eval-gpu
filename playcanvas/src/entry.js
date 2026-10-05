if (new URLSearchParams(location.search).get('scene') === 'exhibition') {
  await import('./exhibition.js');
} else {
  await import('./main.js');
}
