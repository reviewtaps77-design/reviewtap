import { sanitizeEmail, sanitizeText, sanitizeUrl, sanitizeSlug, sanitizePhone, sanitizeHexColor, sanitizeNumber } from './src/lib/security';
import { parseValidated, businessCreateSchema, feedbackSchema, employeeSchema } from './src/lib/validation';

const results = {
  email: sanitizeEmail('<script>alert(1)</script>test@example.com'),
  text: sanitizeText('hello <script>alert(1)</script> world', 50),
  url: sanitizeUrl('javascript:alert(1)'),
  slug: sanitizeSlug('Bad Slug!!!'),
  phone: sanitizePhone('123<script>evil</script>'),
  color: sanitizeHexColor('red'),
  rating: sanitizeNumber('9', 1, 5),
  business: parseValidated(businessCreateSchema, {
    businessName: '<script>alert(1)</script>',
    slug: 'bad slug',
    ownerName: 'x',
    ownerEmail: 'bad@@example.com',
    ownerPhone: '1 2 3',
    googleReviewUrl: 'javascript:alert(1)',
    plan: 'monthly',
    password: '123',
  }).success,
  feedback: parseValidated(feedbackSchema, {
    rating: 9,
    name: '<b>evil</b>',
    email: 'bad@@example.com',
    employeeSlug: '!!bad',
    sessionToken: 'abc',
  }).success,
  employee: parseValidated(employeeSchema, {
    name: '<script>evil</script>',
    status: 'hacked',
  }).success,
};

console.log(JSON.stringify(results, null, 2));
