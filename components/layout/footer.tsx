import React from 'react'
import Link from "next/link";

import {
  Github,
  Twitter,
  Mail,
  ChevronRight,
} from "lucide-react";
const Footer = () => {
  return (
    <footer className="py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 max-w-5xl mx-auto">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold mb-6">FableWeaver.ai</h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Where AI meets anime recommendations
            </p>
          </div>
          <div className="text-center md:text-left">
            <h4 className="text-xl font-semibold mb-6">Product</h4>
            <ul className="space-y-4">
              <li>
                <Link
                  href="/weave-anime"
                  className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 text-lg flex items-center justify-center md:justify-start"
                >
                  <ChevronRight className="mr-2 h-5 w-5" />
                  WeaveAnime
                </Link>
              </li>
              <li>
                <Link
                  href="/features"
                  className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 text-lg flex items-center justify-center md:justify-start"
                >
                  <ChevronRight className="mr-2 h-5 w-5" />
                  Features
                </Link>
              </li>
            </ul>
          </div>
          <div className="text-center md:text-left">
            <h4 className="text-xl font-semibold mb-6">Company</h4>
            <ul className="space-y-4">
              <li>
                <Link
                  href="/about"
                  className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 text-lg flex items-center justify-center md:justify-start"
                >
                  <ChevronRight className="mr-2 h-5 w-5" />
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 text-lg flex items-center justify-center md:justify-start"
                >
                  <ChevronRight className="mr-2 h-5 w-5" />
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div className="text-center md:text-left">
            <h4 className="text-xl font-semibold mb-6">Connect</h4>
            <div className="flex space-x-6 justify-center md:justify-start">
              <Link
                href="https://github.com"
                className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-300"
              >
                <Github className="h-8 w-8" />
              </Link>
              <Link
                href="https://twitter.com"
                className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-300"
              >
                <Twitter className="h-8 w-8" />
              </Link>
              <Link
                href="mailto:contact@fableweaver.ai"
                className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-300"
              >
                <Mail className="h-8 w-8" />
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-center text-gray-600 dark:text-gray-300 text-lg">
            © {new Date().getFullYear()} FableWeaver.ai. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer