
'use client';

import { ContactForm } from './contact-form';

export function HelpSection() {
  return (
    <div className="relative rounded-2xl overflow-hidden p-8 flex flex-col items-center justify-center min-h-[300px]">
      <div className="help-container -z-10"></div>
      <div className="relative z-10 text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Need a Hand?</h2>
        <p className="text-neutral-300 max-w-xl mb-6">
          Whether you've found a bug, have a feature request, or just want to say hi, we'd love to hear from you.
        </p>
        <ContactForm>
          <button className="px-6 py-2 rounded-md bg-white text-black font-semibold hover:bg-neutral-200 transition-colors">
            Get Help
          </button>
        </ContactForm>
      </div>
    </div>
  );
}
