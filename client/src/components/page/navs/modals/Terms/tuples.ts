/**
 * Terms of Use for POWERBACK.us
 * @typedef {Object} Term
 * @property {string} section - The section of the Terms of Use
 * @property {string} term - The term of the Terms of Use
 */

/**
 * Terms of Use for POWERBACK.us
 * @type {Term[]}
 */

export interface Term {
  section: string;
  term: string;
}

export const TERMS: Term[] = [
  {
    section: 'Introduction',
    term: 'Welcome to POWERBACK.us (the “Platform” or “Application”). By accessing or using the POWERBACK.us web application, you agree to these Terms of Use. If you do not agree to these Terms, please do not use the Platform.',
  },
  {
    section: 'Definitions',
    term: 'In these Terms of Use, "we", "our", and "us" refers to the owner of the web application. "You" refers to the user or viewer of our web application.',
  },
  {
    section: 'Use of the Web Application',
    term: 'You may use our web application for your personal, non-commercial use only. You agree not to use our web application for any illegal or unauthorized purpose. You also agree not to modify, distribute, transmit, display, perform, reproduce, publish, license, create derivative works from, transfer, or sell any information, software, products, or services obtained from our web application.',
  },
  {
    section: 'Governing Law',
    term: '   These Terms of Use shall be governed by and construed in accordance with the laws of the United States of America. Any dispute arising under these Terms of Use shall be subject to the exclusive jurisdiction of the courts of the United States of America.',
  },
  {
    section: 'Transparency',
    term: 'We are committed to maintaining transparency and complying with all relevant federal election laws and regulations regarding the management and use of donation funds. As a conduit for political contributions towards federal election campaigns, we will provide clear and accurate information to users regarding how donation funds are managed, allocated, and disbursed in accordance with applicable laws, including the Federal Election Campaign Act (FECA) and regulations issued by the Federal Election Commission (FEC).\n\nUsers will be informed about the allocation of donation funds to specific political campaigns and candidates, as well as any administrative fees or expenses incurred for facilitating the contributions. We will ensure that all contributions are properly disclosed, and information about the recipient campaigns will be made available to users in a transparent manner.\n\nIt is essential to note that political contributions may be subject to limitations and reporting requirements under federal election law. Users are encouraged to familiarize themselves with these legal obligations and exercise their donations accordingly.\n\nWe are committed to upholding the highest standards of integrity and accountability in managing political donations, and we encourage users to reach out to us with any questions or concerns regarding the handling of donation funds. Our aim is to foster an environment of trust and openness as we facilitate small-dollar individual political contributions towards federal election campaigns.',
  },
  {
    section: 'Refunds and Donations',
    term: 'Contributions made through POWERBACK.us are subject to the specific terms disclosed at the time of contribution. Where a contribution is made subject to stated conditions, any eligibility for a refund will be governed by those disclosed terms.\n\nExcept where a refund option is expressly offered and approved in advance, contributions are final and non-refundable. POWERBACK.us does not guarantee that refunds will be available in every circumstance, including after funds have been processed, committed, redirected, or reported in accordance with applicable law and the terms accepted by the contributor.\n\nUsers are responsible for reviewing the applicable contribution terms before completing any transaction.',
  },
  {
    section: 'Conditional Redirects',
    term: 'Contributions made through the POWERBACK.us platform may be conditionally earmarked for one or more federal candidates, subject to publicly disclosed performance criteria or other thresholds.\n\nIf a specified candidate fails to meet those conditions by the relevant deadline, and the contributor has not requested a refund in advance, the contribution will instead be treated as a direct contribution to POWERBACK, a political committee organized under applicable campaign finance laws (the "Committee").\n\nIn such cases:\n\n- The funds will not be forwarded to the candidate.\n- The contribution will be reported to the Federal Election Commission (FEC) as a contribution to the Committee.\n- It will count toward the donor\'s individual contribution limit for PACs under federal law.\n- The contribution is not refundable unless previously requested and approved.\n\nDonors are provided notice of this potential redirection at the point of contribution and must affirmatively agree to these terms before completing their transaction.',
  },
  {
    section: 'Intellectual Property',
    term: 'All content on our web application, including but not limited to text, graphics, logos, button icons, images, audio clips, digital downloads, and software, is the property of the owner of the web application or its content suppliers and is protected by international copyright laws.',
  },
  {
    section: 'Disclaimer of Warranties',
    term: 'Our web application is provided on an "as is" and "as available" basis. We make no representations or warranties of any kind, express or implied, as to the operation of our web application or the information, content, materials, or products included on our web application.',
  },
  {
    section: 'Experimental Use and Limitation of Liability',
    term: 'POWERBACK is an experimental platform operated by an independent, pro-bono developer. By using the web application, you acknowledge and agree that the service is offered “as is” without warranties or guarantees of any kind, express or implied. You understand that errors, outages, or interruptions may occur, and you accept all risks associated with using the web application. POWERBACK does not guarantee the fulfillment of any user expectations or outcomes, and shall not be held liable for any loss, direct or indirect, arising from your use of the web application.\n\n In no event shall we be liable for any direct, indirect, incidental, special, or consequential damages arising out of or in any way connected with the use of our web application or with the delay or inability to use our web application, or for any information, products, and services obtained through our web application, or otherwise arising out of the use of our web application.',
  },
  {
    section: 'Cookie Policy',
    term: `Cookies are small text files stored on your computer or mobile device when you visit a website. They are widely used to help websites function properly and to provide information to site operators.

POWERBACK.us uses cookies for the following purposes:

Authentication: We use cookies to authenticate users and maintain session security. These cookies are essential for the operation of the website and help prevent unauthorized access to user accounts.

Analytics: We use Google Analytics to collect aggregated, anonymized information about how visitors interact with the website. This information helps us understand usage patterns, improve functionality, and enhance the overall user experience.

Preferences: We use cookies to remember certain user preferences and settings that improve usability and consistency when navigating the website.

Types of Cookies We Use:

Session Cookies: These are temporary cookies that are erased when you close your browser. We use these cookies to maintain authentication state during your visit.

Persistent Cookies: These cookies remain on your device for a longer period of time and help us recognize returning visitors and maintain certain preferences.

Third-Party Cookies: Google Analytics may set cookies in order to collect aggregated usage statistics about how visitors interact with the website. These cookies do not provide us with personally identifying information.

Your Choices Regarding Cookies:

Most web browsers allow you to control or disable cookies through your browser settings. If you choose to disable cookies, some portions of the website may not function properly, particularly features that require authentication.

Changes to This Cookie Policy:

We may update this Cookie Policy from time to time to reflect changes in our practices or service offerings. Please review this page periodically for updates. `,
  },
  {
    section: 'Changes to Terms of Use',
    term: ' We reserve the right to modify these Terms of Use at any time, and such modifications shall be effective immediately upon posting on our web application. Your continued use of our web application following any such modifications shall be deemed to constitute your acceptance of such modifications.',
  },
  {
    section: 'Termination',
    term: '  We may terminate your access to our web application at any time, without cause or notice, which may result in the forfeiture and destruction of all information associated with your account.',
  },
  {
    section: 'Contact Information',
    term: 'If you have any questions about these Terms of Use, please contact us at support@powerback.us.',
  },
];
