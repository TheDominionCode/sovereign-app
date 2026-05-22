export type Phrase = {
  category: string;
  from: string;
  to: string;
  why: string;
};

// Built-in language-refinement library. User additions live in elegant_phrases.
export const ELEGANT_PHRASES: Phrase[] = [
  { category: "Saying No", from: "I don't care.", to: "It's not a priority for me at the moment.", why: "Communicates a boundary without dismissiveness." },
  { category: "Saying No", from: "I'm too busy.", to: "My calendar is full this week — let me come back to you.", why: "Specific, professional, leaves a door open." },
  { category: "Saying No", from: "No way.", to: "That's not something I can commit to.", why: "Final without being harsh." },
  { category: "Saying No", from: "Stop asking me.", to: "I've shared my answer — I'd appreciate you respecting it.", why: "Reinforces the boundary calmly." },
  { category: "Disagreeing", from: "You're wrong.", to: "I see it differently.", why: "Opens dialogue instead of closing it." },
  { category: "Disagreeing", from: "That's stupid.", to: "I'm not sure that lines up with what we're trying to do.", why: "Critiques the idea, not the person." },
  { category: "Disagreeing", from: "You don't get it.", to: "Let me try saying it another way.", why: "Takes responsibility for the message." },
  { category: "Boundaries", from: "Stop bothering me.", to: "I need uninterrupted time to focus right now.", why: "States the need, not the offense." },
  { category: "Boundaries", from: "Mind your business.", to: "That's a private decision for me.", why: "Defines the line without insulting." },
  { category: "Boundaries", from: "I don't owe you an explanation.", to: "I've made my decision — and I'm comfortable with it.", why: "Holds the line without picking a fight." },
  { category: "Apologizing", from: "I'm so sorry, sorry, sorry.", to: "Thank you for your patience.", why: "Gratitude is more powerful than apology." },
  { category: "Apologizing", from: "Sorry to bother you.", to: "When you have a moment…", why: "Respects their time without diminishing yours." },
  { category: "Apologizing", from: "Sorry I'm late.", to: "Thank you for waiting.", why: "Honors them instead of dwelling on the mistake." },
  { category: "Confidence", from: "I think maybe…", to: "What I'm seeing is…", why: "States your observation as fact you'll back up." },
  { category: "Confidence", from: "Just my opinion…", to: "From my perspective…", why: "Replaces 'just' (which minimizes) with framing." },
  { category: "Confidence", from: "I'll try to…", to: "I will…", why: "'Try' gives you an out before you've started." },
  { category: "Confidence", from: "Does that make sense?", to: "What questions do you have?", why: "Invites dialogue. Doesn't beg for approval." },
  { category: "Feedback", from: "I know!", to: "Thank you for pointing that out.", why: "'I know' shuts the door. Gratitude leaves it open." },
  { category: "Feedback", from: "That's not fair.", to: "Walk me through how you got there.", why: "Gives you information instead of an argument." },
  { category: "Hard Conversations", from: "We need to talk.", to: "I'd like to think out loud with you about something.", why: "Removes dread. Invites collaboration." },
  { category: "Hard Conversations", from: "You always do this.", to: "I've noticed a pattern that's affecting me.", why: "Specific, observed, owned." },
  { category: "Hard Conversations", from: "You hurt my feelings.", to: "What you said landed harder than maybe you intended.", why: "Names it while giving benefit of the doubt." },
  { category: "Money", from: "I can't afford it.", to: "It's not in my budget right now.", why: "Choice, not lack." },
  { category: "Money", from: "I'm broke.", to: "I'm being intentional with my money this season.", why: "Speak the version you're becoming." },
];

export const PHRASE_CATEGORIES = Array.from(
  new Set(ELEGANT_PHRASES.map((p) => p.category))
);
