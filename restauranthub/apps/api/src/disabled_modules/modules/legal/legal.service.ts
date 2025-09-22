import { Injectable } from '@nestjs/common';

@Injectable()
export class LegalService {
  getTermsOfService() {
    return {
      title: 'Terms of Service',
      lastUpdated: '2024-09-05',
      content: `
# Terms of Service

**Effective Date: September 5, 2024**

Welcome to RestaurantHub ("we," "our," or "us"). These Terms of Service ("Terms") govern your use of our platform and services.

## 1. Acceptance of Terms

By accessing or using RestaurantHub, you agree to be bound by these Terms and our Privacy Policy. If you disagree with any part of these Terms, then you may not access our service.

## 2. Description of Service

RestaurantHub is a comprehensive B2B/B2C SaaS platform that provides:
- Restaurant management solutions
- B2B marketplace for food suppliers and vendors
- Job portal and HR management
- Order management and payment processing
- Real-time messaging and notifications
- Analytics and reporting tools

## 3. User Accounts

### 3.1 Account Creation
- You must provide accurate, current, and complete information
- You are responsible for safeguarding your account credentials
- You must notify us immediately of any unauthorized access

### 3.2 Account Types
- **Restaurants**: Business entities operating food services
- **Vendors**: Suppliers of food products and equipment
- **Employees**: Staff members of registered restaurants
- **Customers**: End users placing orders
- **Administrators**: Platform management personnel

## 4. Acceptable Use

### 4.1 Permitted Uses
- Legitimate business operations within the food industry
- Compliance with all applicable laws and regulations
- Respectful interaction with other platform users

### 4.2 Prohibited Activities
- Fraudulent or misleading information
- Harassment, abuse, or harmful conduct
- Unauthorized access to other accounts or systems
- Spamming or unsolicited communications
- Violation of intellectual property rights

## 5. Payment Terms

### 5.1 Subscription Fees
- Fees are charged in advance on a monthly or annual basis
- All fees are non-refundable except as required by law
- We reserve the right to change pricing with 30 days notice

### 5.2 Transaction Processing
- We facilitate payments between users but are not a party to transactions
- Transaction fees may apply as specified in your account settings
- Disputes should be resolved directly between parties

## 6. Intellectual Property

### 6.1 Platform Rights
- RestaurantHub owns all rights to the platform, including software, design, and content
- You receive a limited, non-exclusive license to use our services

### 6.2 User Content
- You retain ownership of content you submit
- You grant us a license to use, store, and display your content as necessary for service provision
- You warrant that you have the right to submit your content

## 7. Privacy and Data Protection

### 7.1 Data Collection
- We collect and process data as described in our Privacy Policy
- We implement industry-standard security measures
- We comply with applicable data protection regulations

### 7.2 Data Usage
- Your data is used to provide and improve our services
- We do not sell personal data to third parties
- Business analytics may be anonymized and aggregated

## 8. Service Availability

### 8.1 Uptime
- We strive for 99.9% uptime but do not guarantee uninterrupted service
- Maintenance windows will be scheduled during low-usage periods
- We will provide advance notice of planned maintenance

### 8.2 Support
- Customer support is available via email and in-app messaging
- Response times vary based on your subscription level
- Critical issues receive priority handling

## 9. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW:
- We are not liable for indirect, incidental, or consequential damages
- Our total liability is limited to the amount paid for services in the preceding 12 months
- We do not warrant that the service will meet all your requirements

## 10. Indemnification

You agree to indemnify and hold us harmless from any claims, damages, or expenses arising from:
- Your use of the platform
- Your violation of these Terms
- Your violation of any third-party rights

## 11. Termination

### 11.1 By You
- You may terminate your account at any time through account settings
- Cancellation takes effect at the end of your current billing period

### 11.2 By Us
- We may suspend or terminate accounts for Terms violations
- We will provide 30 days notice for non-payment related terminations
- Immediate termination may occur for serious violations

## 12. Modifications

We reserve the right to modify these Terms at any time. We will:
- Provide notice of material changes
- Allow reasonable time for review before changes take effect
- Consider your continued use as acceptance of modified Terms

## 13. Governing Law

These Terms are governed by the laws of India. Any disputes will be resolved in the courts of New Delhi, India.

## 14. Contact Information

For questions about these Terms, contact us at:
- **Email**: legal@restauranthub.com
- **Address**: RestaurantHub Legal Team, [Your Address]
- **Phone**: [Your Phone Number]

## 15. Severability

If any provision of these Terms is found unenforceable, the remaining provisions will continue in full force and effect.

---

*Last Updated: September 5, 2024*
*Version: 1.0*
      `,
    };
  }

  getPrivacyPolicy() {
    return {
      title: 'Privacy Policy',
      lastUpdated: '2024-09-05',
      content: `
# Privacy Policy

**Effective Date: September 5, 2024**

RestaurantHub ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information.

## 1. Information We Collect

### 1.1 Personal Information
- **Account Information**: Name, email address, phone number, business details
- **Profile Information**: Profile pictures, preferences, business descriptions
- **Payment Information**: Billing addresses, payment methods (processed securely by third parties)
- **Communication Data**: Messages, support tickets, feedback

### 1.2 Business Information
- **Restaurant Data**: Menu items, pricing, operating hours, location
- **Order Information**: Transaction details, delivery addresses, order history
- **Financial Data**: Revenue reports, transaction records, tax information
- **Employee Data**: Staff information, roles, permissions, performance metrics

### 1.3 Technical Information
- **Usage Data**: Pages visited, features used, time spent on platform
- **Device Information**: Browser type, operating system, IP address
- **Location Data**: GPS coordinates for delivery and location-based services
- **Cookies and Tracking**: Session data, preferences, authentication tokens

## 2. How We Use Your Information

### 2.1 Service Provision
- Account management and authentication
- Order processing and fulfillment
- Payment processing and billing
- Customer support and communication

### 2.2 Business Operations
- Analytics and reporting
- Performance monitoring and optimization
- Fraud prevention and security
- Compliance with legal obligations

### 2.3 Communication
- Service announcements and updates
- Marketing communications (with consent)
- Customer support responses
- Legal notices and policy updates

### 2.4 Improvement and Development
- Platform enhancement and new features
- User experience optimization
- Market research and analysis
- Quality assurance and testing

## 3. Information Sharing

### 3.1 With Your Consent
- Third-party integrations you authorize
- Marketing partnerships (opt-in only)
- Data export requests

### 3.2 Service Providers
- **Payment Processors**: Stripe, Razorpay for secure payment handling
- **Cloud Services**: AWS, Google Cloud for data storage and computing
- **Email Services**: SendGrid, AWS SES for transactional emails
- **Analytics**: Aggregated, anonymized data for platform insights

### 3.3 Legal Requirements
- Compliance with court orders or legal processes
- Protection of rights, property, or safety
- Government investigations or regulatory requests

### 3.4 Business Transactions
- Mergers, acquisitions, or asset sales
- Due diligence processes (with appropriate protections)

## 4. Data Security

### 4.1 Technical Safeguards
- **Encryption**: AES-256 encryption for data at rest, TLS 1.3 for data in transit
- **Access Controls**: Role-based permissions and multi-factor authentication
- **Network Security**: Firewalls, intrusion detection, and monitoring
- **Regular Audits**: Security assessments and vulnerability testing

### 4.2 Organizational Measures
- **Employee Training**: Privacy and security awareness programs
- **Access Policies**: Need-to-know basis for data access
- **Incident Response**: Breach detection and response procedures
- **Vendor Management**: Due diligence and contractual protections

## 5. Data Retention

### 5.1 Account Data
- Active accounts: Retained while account is active
- Closed accounts: Deleted within 30 days of closure request
- Legal obligations: Retained as required by applicable laws

### 5.2 Transaction Data
- Order records: Retained for 7 years for tax and audit purposes
- Payment information: Processed by third parties, not stored by us
- Communication logs: Retained for 2 years for support and quality purposes

### 5.3 Analytics Data
- Aggregated data: May be retained indefinitely (anonymized)
- Individual usage data: Retained for 2 years
- Log files: Retained for 1 year for security and troubleshooting

## 6. Your Rights

### 6.1 Access and Portability
- Request copies of your personal data
- Export your data in standard formats
- Receive information about data processing activities

### 6.2 Correction and Update
- Update your account information at any time
- Correct inaccurate or incomplete data
- Modify your privacy preferences

### 6.3 Deletion and Restriction
- Delete your account and associated data
- Request deletion of specific information
- Restrict processing for specific purposes

### 6.4 Marketing Communications
- Opt-out of marketing emails
- Manage communication preferences
- Withdraw consent for data processing

## 7. Cookies and Tracking

### 7.1 Types of Cookies
- **Essential**: Required for platform functionality
- **Performance**: Anonymous usage analytics
- **Functional**: User preferences and settings
- **Marketing**: Targeted advertising (with consent)

### 7.2 Cookie Management
- Browser settings to control cookies
- Opt-out mechanisms for non-essential cookies
- Regular review and cleanup of stored data

## 8. International Data Transfers

### 8.1 Cross-Border Processing
- Data may be processed in multiple countries
- Adequate protection measures in place
- Compliance with local data protection laws

### 8.2 Transfer Safeguards
- Standard contractual clauses
- Adequacy decisions by relevant authorities
- Certification schemes where applicable

## 9. Children's Privacy

### 9.1 Age Restrictions
- Platform not intended for users under 16
- Parental consent required for minors
- Special protections for children's data

### 9.2 Parental Rights
- Access to child's information
- Deletion of child's data
- Control over data collection and use

## 10. Changes to This Policy

### 10.1 Updates
- We may update this policy periodically
- Material changes will be communicated via email
- Continued use constitutes acceptance of changes

### 10.2 Version Control
- Previous versions available upon request
- Change history maintained for transparency

## 11. Regional Compliance

### 11.1 India (Personal Data Protection)
- Compliance with Digital Personal Data Protection Act
- Data localization requirements where applicable
- Rights specific to Indian residents

### 11.2 European Union (GDPR)
- Lawful basis for processing personal data
- Rights under GDPR for EU residents
- Data Protection Officer contact information

### 11.3 United States
- State-specific privacy rights (California, Virginia, etc.)
- Compliance with sectoral regulations
- Safe Harbor provisions where applicable

## 12. Contact Information

### 12.1 Privacy Inquiries
- **Email**: privacy@restauranthub.com
- **Address**: RestaurantHub Privacy Team, [Your Address]
- **Response Time**: Within 30 days of receipt

### 12.2 Data Protection Officer
- **Email**: dpo@restauranthub.com
- **Role**: Independent oversight of privacy practices

### 12.3 Supervisory Authority
For EU residents:
- Contact your local data protection authority
- File complaints about privacy violations

---

*Last Updated: September 5, 2024*
*Version: 1.0*
      `,
    };
  }

  getCookiePolicy() {
    return {
      title: 'Cookie Policy',
      lastUpdated: '2024-09-05',
      content: `
# Cookie Policy

**Effective Date: September 5, 2024**

This Cookie Policy explains how RestaurantHub uses cookies and similar tracking technologies on our platform.

## 1. What Are Cookies

Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and improving our services.

## 2. Types of Cookies We Use

### 2.1 Essential Cookies
These cookies are necessary for the platform to function properly and cannot be disabled:

- **Authentication Cookies**: Keep you logged in during your session
- **Security Cookies**: Protect against fraud and security threats
- **Load Balancing**: Ensure optimal performance across our servers
- **CSRF Protection**: Prevent cross-site request forgery attacks

**Legal Basis**: Legitimate interest in providing secure platform access

### 2.2 Performance Cookies
These cookies help us understand how you use our platform:

- **Analytics Cookies**: Google Analytics, internal metrics
- **Performance Monitoring**: Response times, error tracking
- **Usage Statistics**: Popular features, user flows
- **A/B Testing**: Feature testing and optimization

**Legal Basis**: Legitimate interest in improving our services
**Retention Period**: 2 years maximum

### 2.3 Functional Cookies
These cookies enhance your user experience:

- **Preference Cookies**: Language, timezone, display settings
- **Feature Toggles**: Personalized dashboard layouts
- **Form Data**: Temporary storage of form inputs
- **Theme Settings**: Dark/light mode preferences

**Legal Basis**: Legitimate interest in providing personalized experience
**Retention Period**: 1 year or until changed by user

### 2.4 Marketing Cookies
These cookies are used for advertising purposes (with consent):

- **Advertising Cookies**: Targeted advertisements
- **Social Media Cookies**: Social sharing features
- **Conversion Tracking**: Marketing campaign effectiveness
- **Retargeting**: Showing relevant ads on other websites

**Legal Basis**: Explicit consent
**Retention Period**: 13 months maximum

## 3. Cookie Details

### 3.1 First-Party Cookies

| Cookie Name | Purpose | Type | Expiration |
|-------------|---------|------|------------|
| \`rh_session\` | User authentication | Essential | Session |
| \`rh_csrf\` | CSRF protection | Essential | Session |
| \`rh_prefs\` | User preferences | Functional | 1 year |
| \`rh_lang\` | Language setting | Functional | 1 year |
| \`rh_analytics\` | Usage analytics | Performance | 2 years |

### 3.2 Third-Party Cookies

| Service | Purpose | Privacy Policy |
|---------|---------|----------------|
| Google Analytics | Usage analytics | [Google Privacy Policy](https://policies.google.com/privacy) |
| Stripe | Payment processing | [Stripe Privacy Policy](https://stripe.com/privacy) |
| Razorpay | Payment processing | [Razorpay Privacy Policy](https://razorpay.com/privacy) |
| Cloudinary | Image hosting | [Cloudinary Privacy Policy](https://cloudinary.com/privacy) |

## 4. Managing Cookies

### 4.1 Browser Settings
You can control cookies through your browser settings:

**Chrome**:
1. Settings > Privacy and Security > Cookies
2. Choose your preferred cookie settings
3. Manage exceptions for specific sites

**Firefox**:
1. Settings > Privacy & Security
2. Configure cookie and site data settings
3. Manage individual site permissions

**Safari**:
1. Preferences > Privacy
2. Configure cookie and website data options
3. Manage website-specific settings

**Edge**:
1. Settings > Cookies and site permissions
2. Configure cookie preferences
3. Manage site-specific permissions

### 4.2 Platform Settings
You can manage cookie preferences directly in our platform:

1. **Cookie Preferences**: Access via footer link or account settings
2. **Granular Control**: Enable/disable specific cookie categories
3. **Consent Management**: Update your consent choices at any time
4. **Data Export**: Download your cookie preference history

### 4.3 Opt-Out Tools

- **Google Analytics Opt-out**: [Browser Add-on](https://tools.google.com/dlpage/gaoptout)
- **Industry Opt-out**: [Network Advertising Initiative](https://www.networkadvertising.org/choices/)
- **Your Online Choices**: [EU Cookie Opt-out](https://www.youronlinechoices.com/)

## 5. Mobile Apps

Our mobile applications may use similar tracking technologies:

### 5.1 App-Specific Identifiers
- **Device ID**: For analytics and crash reporting
- **Push Tokens**: For notification delivery
- **App Instance ID**: For feature toggles and A/B testing

### 5.2 SDK Privacy
- **Analytics SDKs**: Firebase, Mixpanel (with user consent)
- **Crash Reporting**: Crashlytics for error tracking
- **Performance Monitoring**: Application performance insights

### 5.3 Mobile Settings
- **iOS**: Settings > Privacy > Advertising > Limit Ad Tracking
- **Android**: Settings > Google > Ads > Opt out of interest-based ads

## 6. Local Storage

We also use HTML5 local storage for:

### 6.1 Application Data
- **Session Storage**: Temporary data during your visit
- **Local Storage**: Persistent user preferences
- **IndexedDB**: Offline functionality and caching

### 6.2 Management
- **Browser Tools**: Developer tools to view/clear storage
- **Platform Settings**: Clear data through account settings
- **Automatic Cleanup**: Expired data removed automatically

## 7. Do Not Track

We currently do not respond to Do Not Track (DNT) signals, as there is no industry standard for how to interpret these signals. We are monitoring industry developments and may update our practices in the future.

## 8. Updates to This Policy

### 8.1 Change Notifications
- Email notifications for material changes
- Platform notifications for cookie preference updates
- Version history available upon request

### 8.2 Consent Re-confirmation
- Annual consent renewal reminders
- New consent required for additional tracking technologies
- Opt-in required for new marketing cookies

## 9. Legal Compliance

### 9.1 Regional Requirements
- **EU ePrivacy Directive**: Consent for non-essential cookies
- **GDPR**: Data protection rights for EU residents  
- **CCPA**: California privacy rights for residents
- **Indian IT Rules**: Data protection and cookie requirements

### 9.2 Industry Standards
- **IAB Framework**: Transparency and consent framework
- **Cookie Duration**: Minimum necessary duration
- **Purpose Limitation**: Cookies used only for stated purposes

## 10. Contact Information

### 10.1 Cookie Questions
- **Email**: cookies@restauranthub.com
- **Response Time**: Within 5 business days

### 10.2 Technical Support
- **Email**: support@restauranthub.com  
- **Help Center**: [help.restauranthub.com](https://help.restauranthub.com)

### 10.3 Privacy Officer
- **Email**: privacy@restauranthub.com
- **Address**: RestaurantHub Privacy Team, [Your Address]

---

*Last Updated: September 5, 2024*
*Version: 1.0*

**Note**: This Cookie Policy is part of our comprehensive Privacy Policy. Please review both documents for complete information about our data practices.
      `,
    };
  }

  getDataProcessingAgreement() {
    return {
      title: 'Data Processing Agreement',
      lastUpdated: '2024-09-05',
      content: `
# Data Processing Agreement

**Effective Date: September 5, 2024**

This Data Processing Agreement ("DPA") forms part of the Terms of Service between RestaurantHub and you ("Data Controller") regarding the processing of Personal Data in connection with the Services.

## 1. Definitions

- **"Controller"**: The entity that determines the purposes and means of processing Personal Data
- **"Processor"**: The entity that processes Personal Data on behalf of the Controller  
- **"Personal Data"**: Any information relating to an identified or identifiable natural person
- **"Processing"**: Any operation performed on Personal Data
- **"Sub-processor"**: Any third party engaged by RestaurantHub to process Personal Data

## 2. Data Processing Details

### 2.1 Categories of Personal Data
- Customer contact information (name, email, phone)
- Order and transaction data
- Employee information and HR data
- Business contact details
- Usage and analytics data
- Communication records

### 2.2 Categories of Data Subjects
- Restaurant customers and employees
- Vendor representatives
- Job applicants and employees
- Business contacts
- Platform users

### 2.3 Processing Purposes
- Service provision and platform operation
- Order processing and fulfillment
- Customer support and communication
- Analytics and business intelligence
- Compliance with legal obligations

## 3. Controller and Processor Obligations

### 3.1 RestaurantHub as Processor
RestaurantHub will:
- Process Personal Data only on documented instructions from Controller
- Ensure confidentiality of Personal Data
- Implement appropriate technical and organizational measures
- Assist Controller with data subject rights requests
- Notify Controller of personal data breaches without undue delay
- Delete or return Personal Data upon termination

### 3.2 Controller Responsibilities
Controller warrants that:
- It has lawful basis for processing Personal Data
- It has obtained necessary consents where required
- Instructions to RestaurantHub comply with applicable law
- It will cooperate with RestaurantHub on compliance matters

## 4. Security Measures

### 4.1 Technical Measures
- Encryption of data at rest and in transit
- Access controls and authentication
- Network security and firewalls
- Regular security assessments
- Incident response procedures

### 4.2 Organizational Measures
- Staff training on data protection
- Confidentiality agreements
- Access on need-to-know basis
- Vendor management program
- Regular policy reviews

## 5. Sub-processing

### 5.1 Authorized Sub-processors
RestaurantHub may engage sub-processors including:
- Cloud infrastructure providers (AWS, Google Cloud)
- Payment processors (Stripe, Razorpay)
- Email service providers (SendGrid, AWS SES)
- Analytics services (Google Analytics)

### 5.2 Sub-processor Requirements
All sub-processors must:
- Provide appropriate data protection guarantees
- Be bound by data protection obligations equivalent to this DPA
- Be subject to audit and inspection rights

### 5.3 New Sub-processors
- Controller will be notified of new sub-processors
- Controller has 30 days to object to new sub-processors
- Alternative solutions will be explored for valid objections

## 6. Data Subject Rights

### 6.1 Assistance with Rights Requests
RestaurantHub will assist Controller with:
- Access requests and data portability
- Rectification of inaccurate data
- Erasure of personal data
- Restriction of processing
- Objections to processing

### 6.2 Response Timeframes
- Technical assistance within 5 business days
- Data export within 30 days
- Deletion requests within 10 business days

## 7. Data Transfers

### 7.1 International Transfers
Data may be processed in:
- India (primary data center)
- United States (cloud infrastructure)
- European Union (CDN and analytics)

### 7.2 Transfer Safeguards
- Standard Contractual Clauses
- Adequacy decisions where available
- Additional safeguards for restricted transfers

## 8. Data Breach Notification

### 8.1 Notification Process
RestaurantHub will:
- Notify Controller within 24 hours of becoming aware of breach
- Provide available information about the breach
- Assist with breach investigation and response
- Implement measures to mitigate breach impact

### 8.2 Required Information
- Nature of the breach and data involved
- Likely consequences of the breach
- Measures taken to address the breach
- Contact information for further details

## 9. Audits and Inspections

### 9.1 Audit Rights
Controller has the right to:
- Conduct audits of RestaurantHub's data processing
- Review security certifications and assessment reports
- Inspect relevant data processing facilities
- Engage third-party auditors (with reasonable notice)

### 9.2 Audit Frequency
- Annual audits permitted
- Additional audits for cause
- Remote audits preferred where possible
- On-site audits with 30 days notice

## 10. Data Retention and Deletion

### 10.1 Retention Periods
- Account data: Duration of service agreement
- Transaction data: 7 years for compliance
- Analytics data: 2 years maximum
- Log files: 1 year maximum

### 10.2 Deletion Process
Upon termination:
- Personal Data deleted within 30 days
- Backup copies deleted within 90 days
- Aggregated/anonymized data may be retained
- Certification of deletion provided upon request

## 11. Liability and Indemnification

### 11.1 Data Protection Violations
- Each party liable for its own violations
- RestaurantHub liable for sub-processor violations
- Liability caps as specified in main agreement

### 11.2 Regulatory Fines
- Controller responsible for fines due to its instructions
- RestaurantHub responsible for fines due to its violations
- Cooperation required for regulatory proceedings

## 12. Term and Termination

### 12.1 Term
This DPA remains in effect while RestaurantHub processes Personal Data on Controller's behalf.

### 12.2 Survival
The following provisions survive termination:
- Data deletion obligations
- Confidentiality requirements  
- Liability limitations
- Audit and inspection rights

## 13. Updates and Amendments

### 13.1 DPA Updates
RestaurantHub may update this DPA to:
- Reflect changes in applicable law
- Address new data protection requirements
- Incorporate industry best practices

### 13.2 Amendment Process
- 30 days notice for material changes
- Controller may terminate for unacceptable changes
- Continued use constitutes acceptance

---

**Contact Information**

For DPA-related inquiries:
- **Email**: dpa@restauranthub.com
- **Address**: RestaurantHub Legal Team, [Your Address]

*Last Updated: September 5, 2024*
*Version: 1.0*
      `,
    };
  }

  getAllLegalDocuments() {
    return {
      documents: [
        {
          id: 'terms-of-service',
          title: 'Terms of Service',
          description: 'Our terms and conditions for using RestaurantHub platform',
          lastUpdated: '2024-09-05',
        },
        {
          id: 'privacy-policy',
          title: 'Privacy Policy',
          description: 'How we collect, use, and protect your personal information',
          lastUpdated: '2024-09-05',
        },
        {
          id: 'cookie-policy',
          title: 'Cookie Policy',
          description: 'Information about cookies and tracking technologies we use',
          lastUpdated: '2024-09-05',
        },
        {
          id: 'data-processing-agreement',
          title: 'Data Processing Agreement',
          description: 'Terms governing the processing of personal data for business customers',
          lastUpdated: '2024-09-05',
        },
      ],
      disclaimer: 'These legal documents are provided for informational purposes. Please consult with legal counsel for specific legal advice.',
    };
  }
}