import { useState, type FormEvent } from 'react';
import { company, mapLink, services, whatsappLink } from './content';
import { Icon } from './Icons';

export default function Contact() {
  const [mapVisible, setMapVisible] = useState(false);
  const [prepared, setPrepared] = useState('');
  const [error, setError] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const get = (key: string) => String(data.get(key) || '').trim();
    if (!get('name') || !get('message')) { setError('Please enter your name and a short description of your requirement.'); return; }
    setError('');
    const message = `Hello HST Enterprises,\n\nMy name is ${get('name')}${get('company') ? ` from ${get('company')}` : ''}.\nEmail: ${get('email')}\nRequirement: ${get('service')}\n\n${get('message')}\n\nPlease contact me to discuss specifications, availability, and a quotation.`;
    const url = whatsappLink(message);
    setPrepared(url);
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  return <section className="contact-section section-space" id="contact" tabIndex={-1}>
    <div className="section-inner contact-grid">
      <div className="contact-copy"><p className="eyebrow"><span/>START A CONVERSATION</p><h2>Big plans.<br/>Let’s <em>connect.</em></h2><p className="section-description">A single component or a complete requirement. Tell us what you have in mind, and we’ll take it from there.</p>
        <div className="contact-methods"><a href={`tel:+${company.whatsapp}`}><span className="contact-icon"><Icon name="phone"/></span><span><small>CALL OUR TEAM</small>{company.phone}</span><Icon name="diagonal" size={19}/></a><a href={`mailto:${company.email}`}><span className="contact-icon"><Icon name="mail"/></span><span><small>WRITE TO US</small>{company.email}</span><Icon name="diagonal" size={19}/></a></div>
        <div className="map-card">{mapVisible ? <iframe title="HST Enterprises address on Google Maps" src={`https://maps.google.com/maps?q=${encodeURIComponent(company.address)}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/> : <button className="map-preview" type="button" onClick={() => setMapVisible(true)} aria-label="Load interactive map of our Lahore office"><span className="map-road road-one"/><span className="map-road road-two"/><span className="map-road road-three"/><span className="map-pin"><Icon name="pin" size={25}/></span><span className="map-load">Explore our location <Icon name="diagonal" size={15}/></span></button>}
          <div className="map-address"><span><strong>Find us in Lahore</strong><small>6-Muhammadia Electric Market,<br/>15-Brandreth Road, Lahore</small></span><a href={mapLink} target="_blank" rel="noreferrer" aria-label="Get directions to HST Enterprises"><Icon name="diagonal"/></a></div>
        </div>
      </div>
      <form className="enquiry-form" onSubmit={submit} onChange={() => { setPrepared(''); setError(''); }}>
        <div className="form-heading"><span className="form-number">01 / LET’S GET STARTED</span><Icon name="diagonal" size={28}/></div><h3>What can we help you with?</h3><p>Share a few details. We’ll talk through the rest.</p>
        <div className="form-row"><label>Your name <span>*</span><input name="name" placeholder="Full name" autoComplete="name" required maxLength={100}/></label><label>Company<input name="company" placeholder="Company name" autoComplete="organization" maxLength={160}/></label></div>
        <label>Email address <span>*</span><input name="email" type="email" placeholder="you@company.com" autoComplete="email" required maxLength={254}/></label>
        <label>I’m interested in <span>*</span><select name="service" required defaultValue=""><option value="" disabled>Select a service</option>{services.map(s => <option key={s.title}>{s.title}</option>)}<option>Other / general enquiry</option></select></label>
        <label>Your requirement <span>*</span><textarea name="message" rows={4} required maxLength={2000} placeholder="Tell us about your project, products, quantities, or technical requirements…"/></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-maroon submit-enquiry" type="submit">Send enquiry via WhatsApp <Icon name="whatsapp" size={22}/></button>
        <p className="form-note"><Icon name="portal" size={14}/> Opens a WhatsApp draft for you to review and send. No details are stored on this website.</p>
        {prepared && <div className="form-result" role="status">Your enquiry draft is ready. Review it in WhatsApp and tap Send. <a href={prepared} target="_blank" rel="noreferrer">Continue to WhatsApp <Icon name="diagonal" size={15}/></a></div>}
      </form>
    </div>
  </section>;
}
