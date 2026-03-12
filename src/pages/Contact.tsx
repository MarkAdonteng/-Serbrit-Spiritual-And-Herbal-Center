import { useState } from 'react'
import type React from 'react'
import { Button, Input, Panel } from '../components/ui'

export function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <div className="text-xs font-semibold tracking-[0.25em] text-[#1f5f3a]">CONTACT</div>
        <h1 className="mt-1 text-3xl font-extrabold">Get in touch</h1>
        <p className="mt-3 max-w-prose text-sm text-white/70">
          Send a message for product questions, guidance, or partnership inquiries.
        </p>

        <Panel className="mt-6 grid gap-3 p-6 text-sm text-white/70">
          <div className="grid gap-1">
            <div className="text-xs font-semibold tracking-[0.2em] text-[#c9a227]">EMAIL</div>
            <div>info@serbrit.com</div>
          </div>
          <div className="grid gap-1">
            <div className="text-xs font-semibold tracking-[0.2em] text-[#c9a227]">PHONE</div>
            <div>+233 24 306 6335</div>
          </div>
          <div className="grid gap-1">
            <div className="text-xs font-semibold tracking-[0.2em] text-[#c9a227]">LOCATION</div>
            <div>Accra, Ghana</div>
          </div>
        </Panel>
      </div>

      <Panel className="p-6">
        <div className="text-sm font-extrabold">Contact Form</div>
        <form onSubmit={submit} className="mt-4 grid gap-3">
          <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message"
            className="min-h-32 w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 shadow-[0_0_0_1px_rgba(255,255,255,0.15)] outline-none focus:ring-2 focus:ring-[#c9a227]/60"
          />
          {sent ? <div className="text-sm font-semibold text-[#c9a227]">Message received. We’ll respond soon.</div> : null}
          <Button variant="gold" type="submit">
            Send Message
          </Button>
          <div className="text-xs text-white/45">This form is a UI starter; connect it to email service when ready.</div>
        </form>
      </Panel>
    </div>
  )
}
