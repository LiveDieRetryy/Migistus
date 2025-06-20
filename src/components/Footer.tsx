/**
 * Professional MIGISTUS Footer Component
 * 
 * Features:
 * - Comprehensive site navigation and links
 * - Brand representation with tier badges
 * - Social media links
 * - Contact information
 * - Professional layout with MIGISTUS theme
 * - Responsive design
 * - Appears on all pages by default
 * 
 * To disable on specific pages:
 * ComponentName.showFooter = false;
 */

import Link from "next/link";
import { Crown, Star, Users, Mail, MapPin, Phone, Twitter, Github, Linkedin, Facebook } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white border-t border-zinc-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-black" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                MIGISTUS
              </span>
            </div>
            <p className="text-zinc-400 mb-6 leading-relaxed">
              The Guilded Marketplace where community meets commerce. Join the revolution in group buying and discover exclusive products through collective voting.
            </p>
            
            {/* Tier Badges */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center space-x-1 text-zinc-400">
                <Users className="w-4 h-4" />
                <span className="text-sm">Initiate</span>
              </div>
              <div className="flex items-center space-x-1 text-yellow-400">
                <Star className="w-4 h-4" />
                <span className="text-sm">Guild</span>
              </div>
              <div className="flex items-center space-x-1 text-purple-400">
                <Crown className="w-4 h-4" />
                <span className="text-sm">MIGISTUS</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg flex items-center justify-center transition-colors group"
              >
                <Twitter className="w-5 h-5 text-zinc-400 group-hover:text-yellow-400" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg flex items-center justify-center transition-colors group"
              >
                <Facebook className="w-5 h-5 text-zinc-400 group-hover:text-yellow-400" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg flex items-center justify-center transition-colors group"
              >
                <Linkedin className="w-5 h-5 text-zinc-400 group-hover:text-yellow-400" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg flex items-center justify-center transition-colors group"
              >
                <Github className="w-5 h-5 text-zinc-400 group-hover:text-yellow-400" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-zinc-400 hover:text-yellow-400 transition-colors">
                  About MIGISTUS
                </Link>
              </li>
              <li>
                <Link href="/voting" className="text-zinc-400 hover:text-yellow-400 transition-colors">
                  Product Voting
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-zinc-400 hover:text-yellow-400 transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/staff-picks" className="text-zinc-400 hover:text-yellow-400 transition-colors">
                  Staff Picks
                </Link>
              </li>
              <li>
                <Link href="/live" className="text-zinc-400 hover:text-yellow-400 transition-colors">
                  Live Drops
                </Link>
              </li>
              <li>
                <Link href="/pool" className="text-zinc-400 hover:text-yellow-400 transition-colors">
                  Pool Buying
                </Link>
              </li>
            </ul>
          </div>

          {/* Account & Support */}
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-4">Account & Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/login" className="text-zinc-400 hover:text-yellow-400 transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-zinc-400 hover:text-yellow-400 transition-colors">
                  Join Guild
                </Link>
              </li>
              <li>
                <Link href="/account" className="text-zinc-400 hover:text-yellow-400 transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <Link href="/wallet" className="text-zinc-400 hover:text-yellow-400 transition-colors">
                  Wallet
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-zinc-400 hover:text-yellow-400 transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/suppliers" className="text-zinc-400 hover:text-yellow-400 transition-colors">
                  Become a Supplier
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-4">Contact Info</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-zinc-400 text-sm">Email Support</p>
                  <a href="mailto:support@migistus.com" className="text-white hover:text-yellow-400 transition-colors">
                    support@migistus.com
                  </a>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-zinc-400 text-sm">Phone Support</p>
                  <a href="tel:+1-555-MIGISTUS" className="text-white hover:text-yellow-400 transition-colors">
                    +1 (555) MIG-ISTUS
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-zinc-400 text-sm">Headquarters</p>
                  <p className="text-white">
                    123 Guild Street<br />
                    Commerce City, CC 12345
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-zinc-800 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-zinc-400 text-sm">
              © {currentYear} <span className="text-yellow-400 font-semibold">MIGISTUS</span> — The Guilded Marketplace. All rights reserved.
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <Link href="/terms" className="text-zinc-400 hover:text-yellow-400 transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-zinc-400 hover:text-yellow-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/coming-soon" className="text-zinc-400 hover:text-yellow-400 transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
