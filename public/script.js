/* A seção de captura é visível sempre. Ao clicar num download, só rolamos
   até ela e levamos o foco para o e-mail — sem depender de JS para existir. */
(function () {
  var dls = document.querySelectorAll('[data-download]')
  var box = document.getElementById('subscribe')
  var form = document.getElementById('subscribe-form')
  var status = document.getElementById('subscribe-status')
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  for (var i = 0; i < dls.length; i++) {
    dls[i].addEventListener('click', function () {
      /* O download já foi disparado — rolamos até o formulário, sem travar nada. */
      window.setTimeout(function () {
        box.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' })
        var email = document.getElementById('email')
        if (email) email.focus()
      }, 700)
    })
  }

  form && form.addEventListener('submit', function (e) {
    e.preventDefault()
    var email = document.getElementById('email').value
    var marketingConsent = document.getElementById('marketing-consent').checked
    status.textContent = 'Enviando…'
    fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, marketingConsent: marketingConsent })
    }).then(function (res) {
      status.textContent = res.ok
        ? marketingConsent
          ? 'Pronto. Avisaremos sobre versões e conteúdos da CF Gauss.'
          : 'Pronto. Avisamos só quando sair versão nova.'
        : 'Não deu certo. Tente de novo em instantes.'
    }).catch(function () {
      status.textContent = 'Não deu certo. Tente de novo em instantes.'
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
