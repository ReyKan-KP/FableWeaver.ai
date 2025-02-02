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
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";

interface ContactFormEmailProps {
  name?: string;
  email?: string;
  message?: string;
  isAutoReply?: boolean;
}

export const ContactFormEmail = ({
  name = "",
  email = "",
  message = "",
  isAutoReply = false,
}: ContactFormEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        {isAutoReply
          ? "Thanks for reaching out to FableWeaver.ai!"
          : `New message from ${name} through FableWeaver.ai`}
      </Preview>
      <Tailwind>
        <Body className="bg-gray-100 text-gray-800">
          <Container>
            <Section className="bg-white borderBlack my-10 px-10 py-8 rounded-md">
              {isAutoReply ? (
                <>
                  <Heading className="leading-tight">
                    Thanks for contacting FableWeaver.ai!
                  </Heading>
                  <Text>Dear {name},</Text>
                  <Text>
                    Thank you for reaching out! I&apos;ve received your message and
                    will get back to you as soon as possible, usually within 24
                    hours.
                  </Text>
                  <Text>
                    In the meantime, feel free to explore FableWeaver.ai&apos;s
                    features:
                  </Text>
                  <ul>
                    <li>🤖 Create unique AI characters in Character Realm</li>
                    <li>📚 Craft stories in Story Weaver</li>
                    <li>
                      👥 Experience multi-character interactions in Character
                      Confluence
                    </li>
                    <li>🎨 Generate anime content in Weave Anime</li>
                  </ul>
                  <Text>
                    Best regards,
                    <br />
                    Kanishaka Pranjal
                    <br />
                    Creator, FableWeaver.ai
                  </Text>
                </>
              ) : (
                <>
                  <Heading className="leading-tight">
                    Contact Form Submission from {name}
                  </Heading>
                  <Text>
                    You received the following message from the contact form:
                  </Text>
                  <Hr />
                  <Text>
                    <strong>Name:</strong> {name}
                  </Text>
                  <Text>
                    <strong>Email:</strong> {email}
                  </Text>
                  <Text>
                    <strong>Message:</strong>
                  </Text>
                  <Text className="bg-gray-100 p-4 rounded-md">{message}</Text>
                </>
              )}
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
