/* Reveal the subscribe form only after the download click. The download itself is never blocked. */
(function () {
  var dl = document.querySelector('[data-download]')
  var box = document.getElementById('subscribe')
  var form = document.getElementById('subscribe-form')
  var status = document.getElementById('subscribe-status')

  dl && dl.addEventListener('click', function () {
    /* O download já foi disparado — o formulário aparece depois, sem travar nada. */
    window.setTimeout(function () { box.hidden = false }, 700)
  })

  form && form.addEventListener('submit', function (e) {
    e.preventDefault()
    var email = document.getElementById('email').value
    status.textContent = 'Sending…'
    fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    }).then(function (res) {
      status.textContent = res.ok
        ? 'Done. You will hear from us only on releases.'
        : 'That did not work. Try again in a moment.'
    }).catch(function () {
      status.textContent = 'That did not work. Try again in a moment.'
    })
  })

  /* Contador real de downloads via GitHub API — nunca um número inventado. */
  var count = document.getElementById('dl-count')
  if (count) {
    fetch('/api/downloads')
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status) })
      .then(function (d) {
        if (typeof d.total === 'number') {
          count.textContent = d.total.toLocaleString('pt-BR')
        } else {
          throw new Error('sem total')
        }
      })
      .catch(function () { count.parentElement.hidden = true })
  }
})()
