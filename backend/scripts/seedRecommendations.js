import 'dotenv/config';
import mongoose from 'mongoose';
import { hash } from 'bcryptjs';

import User from '../models/User.js';
import Post from '../models/Post.js';
import Community from '../models/Community.js';

const DEFAULTS = {
	users: 100,
	postsPerUser: 5,
	reset: false,
	password: 'SeedPass123!'
};

const FIRST_NAMES = [
'Aarav','Riya','Kabir','Isha','Arjun','Ananya','Dev','Maya',
'Rohan','Neha','Kiran','Sanjay','Aisha','Rahul','Priya',
'Aditya','Nisha','Aman','Sneha','Kunal'
];

const LAST_NAMES = [
'Sharma','Patel','Singh','Shrestha','Gurung','Khan','Rai',
'Thapa','Shah','Pandey','Joshi','Adhikari','Lama','Karki'
];

const INTEREST_POOL = [
'javascript','react','nodejs','typescript','python','machine-learning','deep-learning',
'data-science','cybersecurity','cloud-computing','devops','blockchain','ai',
'photography','videography','graphic-design','illustration','3d-modeling','animation',
'music-production','songwriting','guitar','piano','singing','podcasting',
'gym','yoga','running','cycling','bodybuilding','calisthenics','hiking',
'martial-arts','boxing','swimming',
'camping','travel','backpacking','nature-photography','rock-climbing',
'fishing','birdwatching',
'reading','writing','blogging','philosophy','history','psychology',
'economics','entrepreneurship','finance','investing',
'woodworking','3d-printing','electronics','robotics','arduino',
'raspberry-pi','home-automation',
'cooking','baking','coffee-brewing','food-blogging',
'gaming','chess','board-games','puzzle-solving','esports',
'painting','watercolor','digital-art','calligraphy','sculpting',
'meditation','journaling','minimalism','gardening','DIY-projects'
];

const INTEREST_CLUSTERS = [
['javascript','react','nodejs','typescript','web-development'],
['gym','bodybuilding','running','fitness','nutrition'],
['photography','videography','editing','travel','nature-photography'],
['ai','machine-learning','python','data-science'],
['gaming','esports','streaming','pc-building'],
['cooking','baking','food-blogging','coffee-brewing'],
['painting','illustration','digital-art','animation']
];

const POST_TEMPLATES = [
'Just started learning {interest} and it’s amazing.',
'Anyone here interested in {interest}?',
'Sharing my progress in {interest} today.',
'Looking for tips on improving at {interest}.',
'Working on a project related to {interest}.',
'Really enjoying practicing {interest} lately.',
'Does anyone have resources for {interest}?'
];

function pickOne(arr) {
return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min,max){
return Math.floor(Math.random()*(max-min+1))+min;
}

function pickMany(arr,count){
const copy=[...arr];
const result=[];
while(result.length<count && copy.length){
const index=Math.floor(Math.random()*copy.length);
result.push(copy[index]);
copy.splice(index,1);
}
return result;
}

function parseArgs() {
	const args = process.argv.slice(2);
	const options = { ...DEFAULTS };

	for (const arg of args) {
		if (arg === '--reset') options.reset = true;
		if (arg.startsWith('--users=')) options.users = Number(arg.split('=')[1]);
		if (arg.startsWith('--posts=')) options.postsPerUser = Number(arg.split('=')[1]);
		if (arg.startsWith('--postsPerUser=')) options.postsPerUser = Number(arg.split('=')[1]);
		if (arg.startsWith('--password=')) options.password = arg.split('=')[1];
	}

	return options;
}

function generateName(){
return `${pickOne(FIRST_NAMES)} ${pickOne(LAST_NAMES)}`;
}

function generateUsername(name, runTag, index){
const clean = name.toLowerCase().replace(/\s+/g, '');
return `${clean}_${runTag}_${index + 1}`;
}

function generateUserInterests(){

const cluster = pickOne(INTEREST_CLUSTERS);
const others = pickMany(INTEREST_POOL,15);

const interests=[...new Set([...cluster,...others])];

return interests.slice(0,20);
}

function generatePost(user){

const interest = pickOne(user.interests);
const template = pickOne(POST_TEMPLATES);

return {
user:user._id,
text:template.replace('{interest}',interest),
tags:[interest],
createdAt:new Date(Date.now()-randomInt(0,30)*86400000)
};
}

async function seed(){

const options = parseArgs();

const uri = process.env.MONGO_URI;

if(!uri){
throw new Error('Missing MONGO_URI');
}

await mongoose.connect(uri);

if (options.reset) {
	await User.deleteMany({});
	await Post.deleteMany({});
}

const runTag = Date.now();
const password = await hash(options.password,10);

const users=[];

for(let i=0;i<options.users;i++){

const name = generateName();
const username = generateUsername(name, runTag, i);

users.push({
username,
email:`${username}@skillnest.test`,
password,
bio:'Exploring hobbies and learning new skills.',
interests:generateUserInterests()
});
}

const insertedUsers = await User.insertMany(users);

let communities = await Community.find({ status: 'approved' }).select('_id members').lean();

if (communities.length === 0 && insertedUsers.length > 0) {
	const defaultCommunity = await Community.create({
		name: `Seed Community ${runTag}`,
		description: 'Auto-generated community for feed testing.',
		creator: insertedUsers[0]._id,
		interests: pickMany(INTEREST_POOL, 6),
		members: insertedUsers.map((u) => u._id),
		admins: [insertedUsers[0]._id],
		moderators: [],
		status: 'approved',
		deletionRequested: false
	});

	communities = [{ _id: defaultCommunity._id, members: defaultCommunity.members }];
}

const communityMap = new Map();
for (const community of communities) {
	for (const memberId of community.members || []) {
		const key = String(memberId);
		if (!communityMap.has(key)) {
			communityMap.set(key, []);
		}
		communityMap.get(key).push(community._id);
	}
}

const posts=[];

for(const user of insertedUsers){

for(let i=0;i<options.postsPerUser;i++){

const post = generatePost(user);
const userCommunityIds = communityMap.get(String(user._id)) || [];

// If the user belongs to approved communities, attach some posts to one of them.
if (userCommunityIds.length > 0 && Math.random() < 0.7) {
	post.community = pickOne(userCommunityIds);
}

posts.push(post);

}

}

const insertedPosts = await Post.insertMany(posts);

console.log('Seed complete');
console.log(`Users: ${insertedUsers.length}`);
console.log(`Posts: ${insertedPosts.length}`);
console.log(`Communities detected: ${communities.length}`);
console.log('\nSample login:');
console.log(`email: ${insertedUsers[0].email}`);
console.log(`password: ${options.password}`);

}

seed()
.catch(err=>{
console.error(err);
process.exitCode = 1;
})
.finally(()=>{
mongoose.disconnect();
});