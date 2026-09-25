import { CircleMinus, CirclePlus } from "lucide-react";

// Placeholder policy copy: replace with the shop's real terms before launch.
const faqs = [
  {
    question: "How do I pick equipment for a home gym?",
    answer: [
      "Start with the training you already do. Most strength routines are covered by an adjustable set of dumbbells, one or two kettlebells, and a mat. Add conditioning gear like a bike or rower once the basics are in place.",
      "Measure the room first, including ceiling height if you plan overhead work, and leave about a metre of clear space around anything with moving parts."
    ]
  },
  {
    question: "How long does delivery take?",
    answer: [
      "Every order arrives within 15 days of purchase. Large pieces such as bikes and racks go out by freight, and the carrier contacts you to book a delivery slot."
    ]
  },
  {
    question: "Can I return equipment?",
    answer: [
      "Unused items can be returned within 30 days in their original packaging. Start a return from your order confirmation email and we'll send a label, or arrange a collection for freight items."
    ]
  },
  {
    question: "Is the equipment covered by a warranty?",
    answer: [
      "Every product carries the manufacturer's warranty, from 1 year on accessories up to 5 years on steel frames. The exact term is listed in each product's specs."
    ]
  },
  {
    question: "Do you stock independent brands?",
    answer: [
      "Yes. Most of the catalog comes from small, independent makers. Use the brand filter on any category page to see one brand's range on its own."
    ]
  }
];

export function FaqSection() {
  return (
    <section className="faq-section" id="faq" aria-labelledby="faq-title">
      <div className="faq-intro">
        <p className="eyebrow">Help</p>
        <h2 id="faq-title">FAQs</h2>
        <p>
          Can&apos;t find what you need?{" "}
          <a href="mailto:hello@forgefit.example">Email the team</a> and we&apos;ll get back
          to you within a working day.
        </p>
      </div>

      <div className="faq-list">
        {faqs.map((faq, index) => (
          // A shared name makes the browser keep only one answer open at a time.
          <details className="faq-item" name="faq" open={index === 0} key={faq.question}>
            <summary>
              <span>{faq.question}</span>
              <span className="faq-icon" aria-hidden="true">
                <CirclePlus className="faq-icon-open" size={26} strokeWidth={1.8} />
                <CircleMinus className="faq-icon-close" size={26} strokeWidth={1.8} />
              </span>
            </summary>
            <div className="faq-answer">
              {faq.answer.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
