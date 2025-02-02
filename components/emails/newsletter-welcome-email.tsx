import {
  Html,
  Body,
  Head,
  Heading,
  Hr,
  Container,
  Preview,
  Section,
  Text,
  Link,
  Img,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";

interface NewsletterWelcomeEmailProps {
  email?: string;
}

export const NewsletterWelcomeEmail = ({
  email = "",
}: NewsletterWelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to FableWeaver.ai&apos;s Creative Journey! 🎭✨</Preview>
      <Tailwind>
        <Body className="bg-gray-100 text-gray-800">
          <Container>
            <Section className="bg-white borderBlack my-10 px-10 py-8 rounded-md">
              <Heading className="text-2xl font-bold text-center bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
                Welcome to FableWeaver.ai! 🎭✨
              </Heading>

              <Text className="text-center text-gray-600">
                Get ready to embark on an extraordinary creative journey
              </Text>

              <Hr className="my-6" />

              <Text className="mb-4">
                Thank you for subscribing to our newsletter! You&apos;re now
                part of a community of creative storytellers and AI enthusiasts.
              </Text>

              <Section className="bg-gray-50 p-6 rounded-lg my-6">
                <Heading className="text-xl mb-4">What to Expect:</Heading>
                <ul className="list-none space-y-3">
                  <li>🌟 Weekly creative prompts and inspiration</li>
                  <li>🤖 Updates on new AI features and capabilities</li>
                  <li>💡 Tips and tricks for better storytelling</li>
                  <li>🎨 Showcase of community creations</li>
                  <li>🔮 Early access to new features</li>
                </ul>
              </Section>

              <Section className="text-center my-8">
                <Link
                  href="https://fable-weaver-ai.vercel.app/"
                  className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium"
                >
                  Start Creating Now →
                </Link>
              </Section>

              <Text className="text-sm text-gray-600 mt-6">
                P.S. Feel free to reply to this email if you have any questions
                or suggestions. I&apos;d love to hear from you!
              </Text>

              <Hr className="my-6" />

              <Text className="text-center text-sm text-gray-500">
                Created with ❤️ by Kanishaka Pranjal
              </Text>

              <Text className="text-center text-xs text-gray-400">
                You&apos;re receiving this email because you signed up for
                FableWeaver.ai updates. You can{" "}
                <Link href="#">unsubscribe</Link> at any time.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
